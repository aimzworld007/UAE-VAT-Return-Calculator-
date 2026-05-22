export function sortRemindersByDueDate(rows = []) {
  return [...rows].sort((a, b) => new Date(a.due_date || a.dueDate || 0).getTime() - new Date(b.due_date || b.dueDate || 0).getTime());
}

export function buildReminderDispatchPlan(reminders = []) {
  return sortRemindersByDueDate(reminders).map((reminder) => ({
    reminderId: reminder.id,
    dueDate: reminder.due_date || reminder.dueDate,
    emailEnabled: Boolean(reminder.email_enabled ?? reminder.emailEnabled),
    status: reminder.status,
  }));
}