"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { notFound, useParams } from 'next/navigation';
import { ArrowLeft, Plus, Save } from 'lucide-react';
import { doc, onSnapshot, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';

import { db } from '@/lib/firebase';
import { useAuth } from '@/components/auth-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import type { Task, Subtask } from '@/lib/types';

export default function TaskDetailPage() {
    const params = useParams();
    const { user } = useAuth();
    const { toast } = useToast();
    
    const [task, setTask] = useState<Task | null | undefined>(undefined);
    const [details, setDetails] = useState('');
    const [newSubtaskText, setNewSubtaskText] = useState('');

    const taskId = Array.isArray(params.id) ? params.id[0] : params.id;

    // Real-time listener for a single task document
    useEffect(() => {
        if (!user || !taskId) return;

        const taskDocRef = doc(db, "tasks", taskId);
        const unsubscribe = onSnapshot(taskDocRef, (docSnap) => {
            if (docSnap.exists()) {
                // 1. Cast data to 'any' so TypeScript stops checking for specific fields
                const data = docSnap.data() as any;

                const taskData = {
                    id: docSnap.id,
                    ...data, // Now valid because 'data' is 'any'
                    // 2. Safe Date Conversion (checks if .toDate exists first)
                    dueDate: data.dueDate?.toDate ? data.dueDate.toDate() : data.dueDate,
                    createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
                } as unknown as Task; // 3. Double Cast to force it into the Task shape
                
                setTask(taskData);
                
                // Initialize local state for editing
                if (taskData.details) {
                    setDetails(taskData.details);
                }
            } else {
                setTask(null); // Task not found
            }
        });

        return () => unsubscribe();
    }, [user, taskId]);

    // --- Firestore Update Functions ---

    const handleSaveDetails = async () => {
        const taskDocRef = doc(db, "tasks", taskId);
        try {
            await updateDoc(taskDocRef, { details });
            toast({ title: "Success", description: "Notes have been saved." });
        } catch (error) {
            console.error("Error saving details: ", error);
            toast({ title: "Error", description: "Could not save notes.", variant: 'destructive' });
        }
    };

    const handleAddSubtask = async () => {
        if (!newSubtaskText.trim()) return;
        const taskDocRef = doc(db, "tasks", taskId);
        const newSubtask: Subtask = { text: newSubtaskText, completed: false };
        try {
            await updateDoc(taskDocRef, {
                subtasks: arrayUnion(newSubtask)
            });
            setNewSubtaskText('');
        } catch (error) {
            console.error("Error adding subtask: ", error);
        }
    };
    
    const handleSubtaskToggle = async (subtaskToToggle: Subtask) => {
        const taskDocRef = doc(db, "tasks", taskId);
        const newSubtaskState = { ...subtaskToToggle, completed: !subtaskToToggle.completed };
        try {
            // To update an item in an array, we remove the old one and add the new one
            await updateDoc(taskDocRef, {
                subtasks: arrayRemove(subtaskToToggle)
            });
            await updateDoc(taskDocRef, {
                subtasks: arrayUnion(newSubtaskState)
            });
        } catch (error) {
            console.error("Error toggling subtask: ", error);
        }
    };


    // --- Render Logic ---

    if (task === undefined) {
        return <TaskDetailSkeleton />; // Show loading skeleton
    }

    if (task === null) {
        notFound(); // If task is not found, show 404
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
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-lg font-semibold text-foreground">Notes & Details</h3>
                            <Button size="sm" onClick={handleSaveDetails}>
                                <Save className="mr-2 h-4 w-4" />
                                Save Notes
                            </Button>
                        </div>
                        <Textarea 
                            value={details}
                            onChange={(e) => setDetails(e.target.value)}
                            placeholder="Add your notes, links, or sub-tasks here..." 
                            className="min-h-[200px] bg-background/50"
                        />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">Sub-tasks</h3>
                        <div className="space-y-2">
                            {task.subtasks?.map((subtask, index) => (
                                <div key={index} className="flex items-center gap-3 bg-background/30 p-2 rounded-md">
                                    <Checkbox
                                        id={`subtask-${index}`}
                                        checked={subtask.completed}
                                        onCheckedChange={() => handleSubtaskToggle(subtask)}
                                    />
                                    <label
                                        htmlFor={`subtask-${index}`}
                                        className={`flex-1 text-sm ${subtask.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}
                                    >
                                        {subtask.text}
                                    </label>
                                </div>
                            ))}
                        </div>
                        <div className="flex items-center gap-2 mt-4">
                            <Input 
                                value={newSubtaskText}
                                onChange={(e) => setNewSubtaskText(e.target.value)}
                                placeholder="Add a new sub-task..."
                                onKeyDown={(e) => e.key === 'Enter' && handleAddSubtask()}
                            />
                            <Button onClick={handleAddSubtask} size="icon">
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

// A helper component for the loading state
function TaskDetailSkeleton() {
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