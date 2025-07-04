# Copyright (C) 2021-2022 Intel Corporation
# Copyright (C) CVAT.ai Corporation
#
# SPDX-License-Identifier: MIT

import os.path as osp

from datumaro.components.dataset import StreamDataset
from datumaro.plugins.data_formats.cityscapes import write_label_map
from pyunpack import Archive

from cvat.apps.dataset_manager.bindings import (
    GetCVATDataExtractor,
    detect_dataset,
    import_dm_annotations,
)
from cvat.apps.dataset_manager.util import make_zip_archive

from .registry import dm_env, exporter, importer
from .transformations import EllipsesToMasks, MaskToPolygonTransformation, RotatedBoxesToPolygons
from .utils import make_colormap


@exporter(name="Cityscapes", ext="ZIP", version="1.0")
def _export(dst_file, temp_dir, instance_data, save_images=False):
    with GetCVATDataExtractor(instance_data, include_images=save_images) as extractor:
        dataset = StreamDataset.from_extractors(extractor, env=dm_env)
        dataset.transform(RotatedBoxesToPolygons)
        dataset.transform("polygons_to_masks")
        dataset.transform("boxes_to_masks")
        dataset.transform(EllipsesToMasks)
        dataset.transform("merge_instance_segments")

        dataset.export(
            temp_dir,
            "cityscapes",
            save_media=save_images,
            apply_colormap=True,
            label_map={label: info[0] for label, info in make_colormap(instance_data).items()},
        )

    make_zip_archive(temp_dir, dst_file)


@importer(name="Cityscapes", ext="ZIP", version="1.0")
def _import(src_file, temp_dir, instance_data, load_data_callback=None, **kwargs):
    Archive(src_file.name).extractall(temp_dir)

    labelmap_file = osp.join(temp_dir, "label_colors.txt")
    if not osp.isfile(labelmap_file):
        colormap = {label: info[0] for label, info in make_colormap(instance_data).items()}
        write_label_map(labelmap_file, colormap)

    detect_dataset(temp_dir, format_name="cityscapes", importer=dm_env.importers.get("cityscapes"))
    dataset = StreamDataset.import_from(temp_dir, "cityscapes", env=dm_env)
    dataset = MaskToPolygonTransformation.convert_dataset(dataset, **kwargs)
    if load_data_callback is not None:
        load_data_callback(dataset, instance_data)
    import_dm_annotations(dataset, instance_data)
