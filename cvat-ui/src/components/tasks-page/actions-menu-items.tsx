// Copyright (C) CVAT.ai Corporation
//
// SPDX-License-Identifier: MIT

import React from 'react';
import { Link } from 'react-router-dom';
import { LoadingOutlined } from '@ant-design/icons';
import { MenuProps } from 'antd/lib/menu';
import { usePlugins } from 'utils/hooks';
import { CVATMenuEditLabel } from 'components/common/cvat-menu-edit-label';

interface MenuItemsData {
    taskId: number;
    isAutomaticAnnotationEnabled: boolean;
    isConsensusEnabled: boolean;
    isMergingConsensusEnabled: boolean;
    pluginActions: ReturnType<typeof usePlugins>;
    onMergeConsensusJobs: (() => void) | null;
    onOpenBugTracker: (() => void) | null;
    onUploadAnnotations: () => void;
    onExportDataset: () => void;
    onBackupTask: () => void;
    onRunAutoAnnotation: (() => void) | null;
    onMoveTaskToProject: (() => void) | null;
    onDeleteTask: () => void;
    startEditField: (key: string) => void;
}

export default function TaskActionsItems(menuItemsData: MenuItemsData, taskMenuProps: unknown): MenuProps['items'] {
    const {
        startEditField,
        taskId,
        pluginActions,
        isAutomaticAnnotationEnabled,
        isConsensusEnabled,
        isMergingConsensusEnabled,
        onMergeConsensusJobs,
        onUploadAnnotations,
        onExportDataset,
        onOpenBugTracker,
        onBackupTask,
        onRunAutoAnnotation,
        onMoveTaskToProject,
        onDeleteTask,
    } = menuItemsData;

    const menuItems: [NonNullable<MenuProps['items']>[0], number][] = [];

    menuItems.push([{
        key: 'load_task_anno',
        onClick: onUploadAnnotations,
        label: 'Upload annotations',
    }, 0]);

    menuItems.push([{
        key: 'export_task_dataset',
        onClick: onExportDataset,
        label: 'Export task dataset',
    }, 10]);

    if (onOpenBugTracker) {
        menuItems.push([{
            key: 'open_bug_tracker',
            onClick: onOpenBugTracker,
            label: 'Open bug tracker',
        }, 20]);
    }

    menuItems.push([{
        disabled: isAutomaticAnnotationEnabled,
        key: 'run_auto_annotation',
        onClick: onRunAutoAnnotation ?? undefined,
        label: 'Automatic annotation',
    }, 30]);

    menuItems.push([{
        key: 'backup_task',
        onClick: onBackupTask,
        label: 'Backup Task',
    }, 40]);

    menuItems.push([{
        key: 'edit_assignee',
        onClick: () => startEditField('assignee'),
        label: <CVATMenuEditLabel>Assignee</CVATMenuEditLabel>,
    }, 50]);

    menuItems.push([{
        key: 'view-analytics',
        label: <Link to={`/tasks/${taskId}/analytics`}>View analytics</Link>,
    }, 60]);

    menuItems.push([{
        key: 'quality_control',
        label: <Link to={`/tasks/${taskId}/quality-control`}>Quality control</Link>,
    }, 70]);

    if (isConsensusEnabled) {
        menuItems.push([{
            key: 'consensus_management',
            label: <Link to={`/tasks/${taskId}/consensus`}>Consensus management</Link>,
        }, 75]);
    }

    if (onMergeConsensusJobs) {
        menuItems.push([{
            key: 'merge_consensus_jobs',
            onClick: onMergeConsensusJobs,
            label: 'Merge consensus jobs',
            disabled: isMergingConsensusEnabled,
            itemIcon: isMergingConsensusEnabled ? <LoadingOutlined /> : undefined,
        }, 80]);
    }

    if (onMoveTaskToProject) {
        menuItems.push([{
            key: 'move_task_to_project',
            onClick: onMoveTaskToProject,
            label: 'Move to project',
        }, 90]);
    }

    menuItems.push([{ type: 'divider' }, 89]);
    menuItems.push([{
        key: 'delete_task',
        onClick: onDeleteTask,
        label: 'Delete',
    }, 100]);

    menuItems.push(
        ...pluginActions.map(({ component: Component, weight }, index) => {
            const menuItem = Component({ key: index, targetProps: taskMenuProps });
            return [menuItem, weight] as [NonNullable<MenuProps['items']>[0], number];
        }),
    );

    return menuItems.sort((menuItem1, menuItem2) => menuItem1[1] - menuItem2[1]).map((menuItem) => menuItem[0]);
}
