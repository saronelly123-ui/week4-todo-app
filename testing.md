# TaskFlow — Testing Guide

## Purpose

This guide explains how to manually test the TaskFlow Smart Study Planner.

## Manual Tests

- [ ] Add a new task and confirm it appears in the task list.
- [ ] Mark a task as completed and confirm its status changes.
- [ ] Edit a task and confirm the updated information is displayed.
- [ ] Delete a task and confirm it disappears.
- [ ] Search for a task by its title.
- [ ] Filter tasks using All, Active, and Completed.
- [ ] Switch between light mode and dark mode.
- [ ] Refresh the page and confirm saved tasks remain available.

## Production Build Check

Run the following command:

```bash
npm run check
```

The command should complete successfully and generate the production files in the `dist` directory.

## Expected Result

All manual tests should pass, and the production build should finish without errors.