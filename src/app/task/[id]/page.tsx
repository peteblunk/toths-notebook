// This is a placeholder for the task details page.
// In a real application, you would fetch the task data based on the id.
"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { notFound, useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import type { Task } from '@/lib/types';
import { getTaskById } from '@/lib/mock-data';


export default function TaskDetailPage() {
    const params = useParams();
    const [task, setTask] = useState<Task | null | undefined>(undefined);

    useEffect(() => {
        if (params.id) {
            const taskId = Array.isArray(params.id) ? params.id[0] : params.id;
            const foundTask = getTaskById(taskId);
            setTask(foundTask);
        }
    }, [params.id]);

    if (task === undefined) {
        return (
            <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-4xl">
                <Skeleton className="h-10 w-36 mb-4" />
                <Card className="bg-card/70">
                    <CardHeader>
                        <Skeleton className="h-8 w-1/2" />
                    </CardHeader>
                    <CardContent className="space-y-6">
                         <div>
                            <Skeleton className="h-6 w-1/4 mb-2" />
                            <Skeleton className="h-48 w-full" />
                        </div>
                         <div>
                            <Skeleton className="h-6 w-1/4 mb-2" />
                             <div className="p-4 border-2 border-dashed border-muted rounded-lg text-center text-muted-foreground">
                                <p>Loading sub-tasks...</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

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
