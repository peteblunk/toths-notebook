// This is a placeholder for the task details page.
// In a real application, you would fetch the task data based on the id.
"use client";

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';

// This is mock data. In a real app, you'd fetch this from a database or a global state.
const getTaskById = (id: string) => {
    const tasks = [
        { id: '1', title: 'Morning meditation ritual', dueDate: new Date('2024-08-15'), importance: 'medium', estimatedTime: 15, category: 'Daily Rituals', completed: true },
        { id: '2', title: 'Prepare weekly project report', dueDate: new Date('2024-08-16'), importance: 'high', estimatedTime: 120, category: 'Regular Responsibilities', completed: false },
        { id: '3', title: 'Explore the hidden sector of Cy-Giza', dueDate: new Date(), importance: 'high', estimatedTime: 240, category: 'Special Missions', completed: false },
        { id: '4', title: 'Update firewall and security protocols', dueDate: new Date('2024-08-17'), importance: 'medium', estimatedTime: 45, category: 'Regular Responsibilities', completed: false },
        { id: '5', title: 'Launch the Sun-Ra solar probe', dueDate: new Date('2024-09-01'), importance: 'high', estimatedTime: 480, category: 'Grand Expeditions', completed: false },
        { id: '6', title: 'Daily physical training', dueDate: new Date(), importance: 'low', estimatedTime: 60, category: 'Daily Rituals', completed: false },
    ];
    return tasks.find(task => task.id === id);
}


export default function TaskDetailPage({ params }: { params: { id: string } }) {
    const task = getTaskById(params.id);

    if (!task) {
        notFound();
    }

    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-4xl">
             <Button asChild variant="ghost" className="mb-4">
                <Link href="/">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Tasks
                </Link>
            </Button>
            <Card className="bg-card/70">
                <CardHeader>
                    <CardTitle className="font-headline text-primary text-2xl">{task.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">Notes & Details</h3>
                        <Textarea 
                            placeholder="Add your notes, links, or sub-tasks here..." 
                            className="min-h-[200px] bg-background/50"
                        />
                    </div>
                     <div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">Sub-tasks</h3>
                        <div className="p-4 border-2 border-dashed border-muted rounded-lg text-center text-muted-foreground">
                            <p>Sub-task functionality coming soon.</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}