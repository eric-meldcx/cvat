# Copyright (C) CVAT.ai Corporation
#
# SPDX-License-Identifier: MIT

import csv
import json
import os
import random
import sys
from itertools import product

random.seed(42)

NAME = "tasks"


def read_rules(name):
    rules = []
    with open(os.path.join(sys.argv[1], f"{name}.csv")) as f:
        reader = csv.DictReader(f)
        for row in reader:
            row = {k.lower(): v.lower().replace("n/a", "na") for k, v in row.items()}
            row["limit"] = row["limit"].replace("none", "None")
            found = False
            for col, val in row.items():
                if col in ["limit", "method", "url", "resource"]:
                    continue
                complex_val = [v.strip() for v in val.split(",")]
                if len(complex_val) > 1:
                    found = True
                    for item in complex_val:
                        new_row = row.copy()
                        new_row[col] = item
                        rules.append(new_row)
            if not found:
                rules.append(row)

    return rules


simple_rules = read_rules(NAME)

SCOPES = list({rule["scope"] for rule in simple_rules})
CONTEXTS = ["sandbox", "organization"]
OWNERSHIPS = ["project:owner", "project:assignee", "owner", "assignee", "none"]
GROUPS = ["admin", "user", "worker", "none"]
ORG_ROLES = ["owner", "maintainer", "supervisor", "worker", None]
SAME_ORG = [True, False]


def RESOURCES(scope):
    if scope == "list":
        return [None]
    elif scope.startswith("create") or scope == "import:backup":
        return [
            {
                "owner": {"id": random.randrange(400, 500)},
                "assignee": {"id": random.randrange(500, 600)},
                "organization": {"id": random.randrange(600, 700)},
                "project": {
                    "owner": {"id": random.randrange(700, 800)},
                    "assignee": {"id": random.randrange(800, 900)},
                    "organization": {"id": random.randrange(900, 1000)},
                },
                "user": {"num_resources": count},
            }
            for count in (0, 3, 10)
        ]
    else:
        return [
            {
                "id": random.randrange(300, 400),
                "owner": {"id": random.randrange(400, 500)},
                "assignee": {"id": random.randrange(500, 600)},
                "organization": {"id": random.randrange(600, 700)},
                "project": {
                    "owner": {"id": random.randrange(700, 800)},
                    "assignee": {"id": random.randrange(800, 900)},
                    "organization": {"id": random.randrange(900, 1000)},
                },
            }
        ]


def is_same_org(org1, org2):
    if org1 is not None and org2 is not None:
        return org1["id"] == org2["id"]
    elif org1 is None and org2 is None:
        return True
    else:
        return False


def eval_rule(scope, context, ownership, privilege, membership, data):
    if privilege == "admin":
        return True

    rules = list(filter(lambda r: scope == r["scope"], simple_rules))
    rules = list(filter(lambda r: r["context"] == "na" or context == r["context"], rules))
    rules = list(filter(lambda r: r["ownership"] == "na" or ownership == r["ownership"], rules))
    rules = list(
        filter(
            lambda r: r["membership"] == "na"
            or ORG_ROLES.index(membership) <= ORG_ROLES.index(r["membership"]),
            rules,
        )
    )
    rules = list(filter(lambda r: GROUPS.index(privilege) <= GROUPS.index(r["privilege"]), rules))
    resource = data["resource"]
    rules = list(
        filter(lambda r: not r["limit"] or eval(r["limit"], {"resource": resource}), rules)
    )
    if (
        not is_same_org(data["auth"]["organization"], data["resource"]["organization"])
        and context != "sandbox"
    ):
        return False

    return bool(rules)


def get_data(scope, context, ownership, privilege, membership, resource, same_org):
    data = {
        "scope": scope,
        "auth": {
            "user": {"id": random.randrange(0, 100), "privilege": privilege},
            "organization": (
                {
                    "id": random.randrange(100, 200),
                    "owner": {"id": random.randrange(200, 300)},
                    "user": {"role": membership},
                }
                if context == "organization"
                else None
            ),
        },
        "resource": resource,
    }

    user_id = data["auth"]["user"]["id"]
    if context == "organization":
        org_id = data["auth"]["organization"]["id"]
        if data["auth"]["organization"]["user"]["role"] == "owner":
            data["auth"]["organization"]["owner"]["id"] = user_id

        if same_org:
            data["resource"]["organization"]["id"] = org_id

    if ownership == "owner":
        data["resource"]["owner"]["id"] = user_id

    if ownership == "assignee":
        data["resource"]["assignee"]["id"] = user_id

    if ownership == "project:owner":
        data["resource"]["project"]["owner"]["id"] = user_id

    if ownership == "project:assignee":
        data["resource"]["project"]["assignee"]["id"] = user_id

    return data


def _get_name(prefix, **kwargs):
    name = prefix
    for k, v in kwargs.items():
        prefix = "_" + str(k)
        if isinstance(v, dict):
            if "id" in v:
                v = v.copy()
                v.pop("id")
            if v:
                name += _get_name(prefix, **v)
        else:
            name += "".join(
                c if c.isalnum() else {"@": "_IN_"}.get(c, "_")
                for c in f"{prefix}_{str(v).upper()}"
            )

    return name


def get_name(scope, context, ownership, privilege, membership, resource, same_org):
    return _get_name("test", **locals())


def is_valid(scope, context, ownership, privilege, membership, resource, same_org):
    if context == "sandbox" and membership:
        return False
    if scope == "list" and ownership != "None":
        return False
    if context == "sandbox" and same_org is False:
        return False
    if scope.startswith("create") and ownership in ["owner", "assignee"]:
        return False
    if scope in ["create", "import:backup"] and ownership != "None":
        return False

    return True


def gen_test_rego(name):
    with open(f"{name}_test.gen.rego", "wt") as f:
        f.write(f"package {name}\nimport rego.v1\n\n")
        for scope, context, ownership, privilege, membership, same_org in product(
            SCOPES, CONTEXTS, OWNERSHIPS, GROUPS, ORG_ROLES, SAME_ORG
        ):
            for resource in RESOURCES(scope):
                if not is_valid(
                    scope, context, ownership, privilege, membership, resource, same_org
                ):
                    continue

                data = get_data(
                    scope, context, ownership, privilege, membership, resource, same_org
                )
                test_name = get_name(
                    scope, context, ownership, privilege, membership, resource, same_org
                )
                result = eval_rule(scope, context, ownership, privilege, membership, data)
                f.write(
                    "{test_name} if {{\n    {allow} with input as {data}\n}}\n\n".format(
                        test_name=test_name,
                        allow="allow" if result else "not allow",
                        data=json.dumps(data),
                    )
                )

        # Write the script which is used to generate the file
        with open(sys.argv[0]) as this_file:
            f.write(f"\n\n# {os.path.split(sys.argv[0])[1]}\n")
            for line in this_file:
                if line.strip():
                    f.write(f"# {line}")
                else:
                    f.write(f"#\n")

        # Write rules which are used to generate the file
        with open(os.path.join(sys.argv[1], f"{name}.csv")) as rego_file:
            f.write(f"\n\n# {name}.csv\n")
            for line in rego_file:
                if line.strip():
                    f.write(f"# {line}")
                else:
                    f.write(f"#\n")


gen_test_rego(NAME)
