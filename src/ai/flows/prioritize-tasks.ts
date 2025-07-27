// Prioritize tasks based on due dates, importance, and estimated time.

'use server';

/**
 * @fileOverview This file defines a Genkit flow for prioritizing tasks based on their due dates, importance, and estimated time to complete.
 *
 * - prioritizeTasks - A function that takes a list of tasks and returns a prioritized list.
 * - TaskInput - The input type for a single task.
 * - PrioritizeTasksInput - The input type for the prioritizeTasks function, which is an array of TaskInput.
 * - PrioritizeTasksOutput - The output type for the prioritizeTasks function, which is an array of TaskInput, sorted by priority.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TaskInputSchema = z.object({
  id: z.string().describe('A unique identifier for the task.'),
  title: z.string().describe('The title of the task.'),
  dueDate: z.string().describe('The due date of the task in ISO format (YYYY-MM-DD).'),
  importance: z.enum(['high', 'medium', 'low']).describe('The importance of the task.'),
  estimatedTime: z
    .number()
    .describe('The estimated time to complete the task in minutes.'),
});

export type TaskInput = z.infer<typeof TaskInputSchema>;

const PrioritizeTasksInputSchema = z.array(TaskInputSchema);

export type PrioritizeTasksInput = z.infer<typeof PrioritizeTasksInputSchema>;

const PrioritizeTasksOutputSchema = z.array(TaskInputSchema);

export type PrioritizeTasksOutput = z.infer<typeof PrioritizeTasksOutputSchema>;

export async function prioritizeTasks(tasks: PrioritizeTasksInput): Promise<PrioritizeTasksOutput> {
  return prioritizeTasksFlow(tasks);
}

const prioritizeTasksPrompt = ai.definePrompt({
  name: 'prioritizeTasksPrompt',
  input: {schema: PrioritizeTasksInputSchema},
  output: {schema: PrioritizeTasksOutputSchema},
  prompt: `You are an AI task prioritization expert. Given the following list of tasks, prioritize them based on their due date (tasks with earlier due dates are higher priority), importance (high importance tasks are higher priority), and estimated time to complete (shorter tasks are generally higher priority, but use your discretion). Return the tasks in a JSON array, sorted by priority.  Do not modify the contents of any task.

Tasks:

{{#each this}}
  - ID: {{id}}, Title: {{title}}, Due Date: {{dueDate}}, Importance: {{importance}}, Estimated Time: {{estimatedTime}} minutes
{{/each}}`,
});

const prioritizeTasksFlow = ai.defineFlow(
  {
    name: 'prioritizeTasksFlow',
    inputSchema: PrioritizeTasksInputSchema,
    outputSchema: PrioritizeTasksOutputSchema,
  },
  async tasks => {
    const {output} = await prioritizeTasksPrompt(tasks);
    return output!;
  }
);
