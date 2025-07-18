// Copyright (C) 2019-2022 Intel Corporation
// Copyright (C) CVAT.ai Corporation
//
// SPDX-License-Identifier: MIT

import PluginRegistry from './plugins';
import logger from './logger';
import { Event } from './event';
import ObjectState from './object-state';
import Statistics from './statistics';
import Comment from './comment';
import Issue from './issue';
import { Job, Task } from './session';
import { implementJob, implementTask } from './session-implementation';
import Project from './project';
import implementProject from './project-implementation';
import { Attribute, Label } from './labels';
import MLModel from './ml-model';
import { FrameData, FramesMetaData } from './frames';
import CloudStorage from './cloud-storage';
import Organization from './organization';
import Webhook from './webhook';
import AnnotationGuide from './guide';
import { BaseAction } from './annotations-actions/base-action';
import { BaseCollectionAction } from './annotations-actions/base-collection-action';
import { BaseShapesAction } from './annotations-actions/base-shapes-action';
import QualityReport from './quality-report';
import QualityConflict from './quality-conflict';
import QualitySettings from './quality-settings';
import { JobValidationLayout, TaskValidationLayout } from './validation-layout';
import { Request } from './request';

import * as enums from './enums';

import {
    Exception, ArgumentError, DataError, ScriptingError, ServerError,
} from './exceptions';

import { mask2Rle, rle2Mask, propagateShapes } from './object-utils';
import User from './user';
import config from './config';

import implementAPI from './api-implementation';
import CVATCore from '.';

function build(): CVATCore {
    const cvat: CVATCore = {
        server: {
            async about() {
                const result = await PluginRegistry.apiWrapper(cvat.server.about);
                return result;
            },
            async share(directory = '/', searchPrefix?: string) {
                const result = await PluginRegistry.apiWrapper(cvat.server.share, directory, searchPrefix);
                return result;
            },
            async formats() {
                const result = await PluginRegistry.apiWrapper(cvat.server.formats);
                return result;
            },
            async userAgreements() {
                const result = await PluginRegistry.apiWrapper(cvat.server.userAgreements);
                return result;
            },
            async register(username, firstName, lastName, email, password, userConfirmations) {
                const result = await PluginRegistry.apiWrapper(
                    cvat.server.register,
                    username,
                    firstName,
                    lastName,
                    email,
                    password,
                    userConfirmations,
                );
                return result;
            },
            async login(username, password) {
                const result = await PluginRegistry.apiWrapper(cvat.server.login, username, password);
                return result;
            },
            async logout() {
                const result = await PluginRegistry.apiWrapper(cvat.server.logout);
                return result;
            },
            async changePassword(oldPassword, newPassword1, newPassword2) {
                const result = await PluginRegistry.apiWrapper(
                    cvat.server.changePassword,
                    oldPassword,
                    newPassword1,
                    newPassword2,
                );
                return result;
            },
            async requestPasswordReset(email) {
                const result = await PluginRegistry.apiWrapper(cvat.server.requestPasswordReset, email);
                return result;
            },
            async resetPassword(newPassword1, newPassword2, uid, token) {
                const result = await PluginRegistry.apiWrapper(
                    cvat.server.resetPassword,
                    newPassword1,
                    newPassword2,
                    uid,
                    token,
                );
                return result;
            },
            async authenticated() {
                const result = await PluginRegistry.apiWrapper(cvat.server.authenticated);
                return result;
            },
            async healthCheck(maxRetries = 1, checkPeriod = 3000, requestTimeout = 5000, progressCallback = undefined) {
                const result = await PluginRegistry.apiWrapper(
                    cvat.server.healthCheck,
                    maxRetries,
                    checkPeriod,
                    requestTimeout,
                    progressCallback,
                );
                return result;
            },
            async request(url, data, requestConfig) {
                const result = await PluginRegistry.apiWrapper(cvat.server.request, url, data, requestConfig);
                return result;
            },
            async setAuthData(response) {
                const result = await PluginRegistry.apiWrapper(cvat.server.setAuthData, response);
                return result;
            },
            async installedApps() {
                const result = await PluginRegistry.apiWrapper(cvat.server.installedApps);
                return result;
            },
            async apiSchema() {
                const result = await PluginRegistry.apiWrapper(cvat.server.apiSchema);
                return result;
            },
        },
        projects: {
            async get(filter = {}) {
                const result = await PluginRegistry.apiWrapper(cvat.projects.get, filter);
                return result;
            },
            async searchNames(search = '', limit = 10) {
                const result = await PluginRegistry.apiWrapper(cvat.projects.searchNames, search, limit);
                return result;
            },
        },
        tasks: {
            async get(filter = {}, aggregate = false) {
                const result = await PluginRegistry.apiWrapper(cvat.tasks.get, filter, aggregate);
                return result;
            },
        },
        assets: {
            async create(file: File, guideId: number) {
                const result = await PluginRegistry.apiWrapper(cvat.assets.create, file, guideId);
                return result;
            },
        },
        jobs: {
            async get(filter = {}, aggregate = false) {
                const result = await PluginRegistry.apiWrapper(cvat.jobs.get, filter, aggregate);
                return result;
            },
        },
        frames: {
            async getMeta(type, id) {
                const result = await PluginRegistry.apiWrapper(cvat.frames.getMeta, type, id);
                return result;
            },
        },
        users: {
            async get(filter = {}) {
                const result = await PluginRegistry.apiWrapper(cvat.users.get, filter);
                return result;
            },
        },
        plugins: {
            async list() {
                const result = await PluginRegistry.apiWrapper(cvat.plugins.list);
                return result;
            },
            async register(plugin) {
                const result = await PluginRegistry.apiWrapper(cvat.plugins.register, plugin);
                return result;
            },
        },
        actions: {
            async list() {
                const result = await PluginRegistry.apiWrapper(cvat.actions.list);
                return result;
            },
            async register(action: BaseAction) {
                const result = await PluginRegistry.apiWrapper(cvat.actions.register, action);
                return result;
            },
            async unregister(action: BaseAction) {
                const result = await PluginRegistry.apiWrapper(cvat.actions.unregister, action);
                return result;
            },
            async run(
                instance: Job | Task,
                actions: BaseAction,
                actionsParameters: Record<string, string>,
                frameFrom: number,
                frameTo: number,
                filters: string[],
                onProgress: (
                    message: string,
                    progress: number,
                ) => void,
                cancelled: () => boolean,
            ) {
                const result = await PluginRegistry.apiWrapper(
                    cvat.actions.run,
                    instance,
                    actions,
                    actionsParameters,
                    frameFrom,
                    frameTo,
                    filters,
                    onProgress,
                    cancelled,
                );
                return result;
            },
            async call(
                instance: Job | Task,
                actions: BaseAction,
                actionsParameters: Record<string, string>,
                frame: number,
                states: ObjectState[],
                onProgress: (
                    message: string,
                    progress: number,
                ) => void,
                cancelled: () => boolean,
            ) {
                const result = await PluginRegistry.apiWrapper(
                    cvat.actions.call,
                    instance,
                    actions,
                    actionsParameters,
                    frame,
                    states,
                    onProgress,
                    cancelled,
                );
                return result;
            },
        },
        lambda: {
            async list() {
                const result = await PluginRegistry.apiWrapper(cvat.lambda.list);
                return result;
            },
            async run(task, model, args) {
                const result = await PluginRegistry.apiWrapper(cvat.lambda.run, task, model, args);
                return result;
            },
            async call(task, model, args) {
                const result = await PluginRegistry.apiWrapper(cvat.lambda.call, task, model, args);
                return result;
            },
            async cancel(requestID, functionID) {
                const result = await PluginRegistry.apiWrapper(cvat.lambda.cancel, requestID, functionID);
                return result;
            },
            async listen(requestID, functionID, onChange) {
                const result = await PluginRegistry.apiWrapper(cvat.lambda.listen, requestID, functionID, onChange);
                return result;
            },
            async requests() {
                const result = await PluginRegistry.apiWrapper(cvat.lambda.requests);
                return result;
            },
        },
        logger,
        config: {
            get backendAPI() {
                return config.backendAPI;
            },
            set backendAPI(value) {
                config.backendAPI = value;
            },
            get origin() {
                return config.origin;
            },
            set origin(value) {
                config.origin = value;
            },
            get uploadChunkSize() {
                return config.uploadChunkSize;
            },
            set uploadChunkSize(value) {
                config.uploadChunkSize = value;
            },
            removeUnderlyingMaskPixels: {
                get enabled() {
                    return config.removeUnderlyingMaskPixels.enabled;
                },
                set enabled(value: boolean) {
                    config.removeUnderlyingMaskPixels.enabled = value;
                },
                set onEmptyMaskOccurrence(value: () => void) {
                    config.removeUnderlyingMaskPixels.onEmptyMaskOccurrence = value;
                },
            },
            get onOrganizationChange(): (orgId: number) => void {
                return config.onOrganizationChange;
            },
            set onOrganizationChange(value: (orgId: number) => void) {
                config.onOrganizationChange = value;
            },
            set globalObjectsCounter(value: number) {
                config.globalObjectsCounter = value;
            },
            get requestsStatusDelay() {
                return config.requestsStatusDelay;
            },
            set requestsStatusDelay(value) {
                config.requestsStatusDelay = value;
            },
            get jobMetaDataReloadPeriod() {
                return config.jobMetaDataReloadPeriod;
            },
            set jobMetaDataReloadPeriod(value) {
                config.jobMetaDataReloadPeriod = value;
            },
        },
        enums,
        exceptions: {
            Exception,
            ArgumentError,
            DataError,
            ScriptingError,
            ServerError,
        },
        cloudStorages: {
            async get(filter = {}) {
                const result = await PluginRegistry.apiWrapper(cvat.cloudStorages.get, filter);
                return result;
            },
        },
        organizations: {
            async get(filter = {}) {
                const result = await PluginRegistry.apiWrapper(cvat.organizations.get, filter);
                return result;
            },
            async activate(organization) {
                const result = await PluginRegistry.apiWrapper(cvat.organizations.activate, organization);
                return result;
            },
            async deactivate() {
                const result = await PluginRegistry.apiWrapper(cvat.organizations.deactivate);
                return result;
            },
            async acceptInvitation(key) {
                const result = await PluginRegistry.apiWrapper(
                    cvat.organizations.acceptInvitation,
                    key,
                );
                return result;
            },
            async declineInvitation(key) {
                const result = await PluginRegistry.apiWrapper(
                    cvat.organizations.declineInvitation,
                    key,
                );
                return result;
            },
            async invitations(filter = {}) {
                const result = await PluginRegistry.apiWrapper(cvat.organizations.invitations, filter);
                return result;
            },
        },
        webhooks: {
            async get(filter: any) {
                const result = await PluginRegistry.apiWrapper(cvat.webhooks.get, filter);
                return result;
            },
        },
        consensus: {
            settings: {
                async get(filter = {}) {
                    const result = await PluginRegistry.apiWrapper(cvat.consensus.settings.get, filter);
                    return result;
                },
            },
        },
        analytics: {
            events: {
                async export(filter = {}) {
                    const result = await PluginRegistry.apiWrapper(cvat.analytics.events.export, filter);
                    return result;
                },
            },
            quality: {
                async reports(filter = {}, aggregate = false) {
                    const result = await PluginRegistry.apiWrapper(cvat.analytics.quality.reports, filter, aggregate);
                    return result;
                },
                async conflicts(filter = {}) {
                    const result = await PluginRegistry.apiWrapper(cvat.analytics.quality.conflicts, filter);
                    return result;
                },
                settings: {
                    async get(filter = {}, aggregate = false) {
                        const result = await PluginRegistry.apiWrapper(
                            cvat.analytics.quality.settings.get,
                            filter,
                            aggregate,
                        );
                        return result;
                    },
                },
            },
        },
        requests: {
            async list() {
                const result = await PluginRegistry.apiWrapper(cvat.requests.list);
                return result;
            },
            async cancel(rqID: string) {
                const result = await PluginRegistry.apiWrapper(cvat.requests.cancel, rqID);
                return result;
            },
            async listen(
                rqID: string,
                options: {
                    callback: (request: Request) => void,
                    initialRequest?: Request,
                },
            ) {
                const result = await PluginRegistry.apiWrapper(cvat.requests.listen, rqID, options);
                return result;
            },
        },
        classes: {
            User,
            Project: implementProject(Project),
            Task: implementTask(Task),
            Job: implementJob(Job),
            Event,
            Attribute,
            Label,
            Statistics,
            ObjectState,
            MLModel,
            Comment,
            Issue,
            FrameData,
            CloudStorage,
            Organization,
            Webhook,
            AnnotationGuide,
            BaseShapesAction,
            BaseCollectionAction,
            QualitySettings,
            QualityConflict,
            QualityReport,
            Request,
            FramesMetaData,
            JobValidationLayout,
            TaskValidationLayout,
        },
        utils: {
            mask2Rle,
            rle2Mask,
            propagateShapes,
        },
    };

    cvat.server = Object.freeze(cvat.server);
    cvat.projects = Object.freeze(cvat.projects);
    cvat.tasks = Object.freeze(cvat.tasks);
    cvat.assets = Object.freeze(cvat.assets);
    cvat.jobs = Object.freeze(cvat.jobs);
    cvat.frames = Object.freeze(cvat.frames);
    cvat.users = Object.freeze(cvat.users);
    cvat.plugins = Object.freeze(cvat.plugins);
    cvat.lambda = Object.freeze(cvat.lambda);
    // logger: todo: logger storage implemented other way
    cvat.config = Object.freeze(cvat.config);
    cvat.enums = Object.freeze(cvat.enums);
    cvat.exceptions = Object.freeze(cvat.exceptions);
    cvat.cloudStorages = Object.freeze(cvat.cloudStorages);
    cvat.organizations = Object.freeze(cvat.organizations);
    cvat.webhooks = Object.freeze(cvat.webhooks);
    cvat.consensus = Object.freeze(cvat.consensus);
    cvat.analytics = Object.freeze(cvat.analytics);
    cvat.classes = Object.freeze(cvat.classes);
    cvat.utils = Object.freeze(cvat.utils);

    const implemented = Object.freeze(implementAPI(cvat));
    return implemented;
}

export default build();
