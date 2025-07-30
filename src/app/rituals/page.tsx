"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Trash2, BookOpen } from 'lucide-react';
import { collection, query, where, onSnapshot, deleteDoc, doc } from 'firebase/firestore';

import { db } from '@/lib/firebase';
import { useAuth } from '@/components/auth-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import type { Task } from '@/lib/types';
import { EditRitualDialog } from '@/components/edit-ritual-dialog'; // Import the new component

export default function ManageRitualsPage() {
    const [rituals, setRituals] = useState<Task[]>([]);
    const { user } = useAuth();
    const { toast } = useToast();

    // Real-time listener for the dailyRituals collection
    useEffect(() => {
        if (!user) {
            setRituals([]);
            return;
        }

        const ritualsCollection = collection(db, 'dailyRituals');
        const q = query(ritualsCollection, where("userId", "==", user.uid));

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const ritualsData: Task[] = [];
            querySnapshot.forEach((doc) => {
                ritualsData.push({ id: doc.id, ...doc.data() } as Task);
            });
            setRituals(ritualsData);
        });

        return () => unsubscribe();
    }, [user]);

    const handleDeleteRitual = async (ritualId: string, ritualTitle: string) => {
        // A simple confirmation dialog
        if (!confirm(`Are you sure you want to delete the ritual "${ritualTitle}"?`)) {
            return;
        }
        
        const ritualDocRef = doc(db, 'dailyRituals', ritualId);
        try {
            await deleteDoc(ritualDocRef);
            toast({
                title: "Ritual Erased",
                description: `"${ritualTitle}" has been removed from your daily rituals.`,
            });
        } catch (error) {
            console.error("Error deleting ritual: ", error);
            toast({ title: "Error", description: "Could not delete ritual.", variant: 'destructive' });
        }
    };

    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-4xl">
            <Button asChild variant="ghost" className="mb-4">
                <Link href="/">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Tasks
                </Link>
            </Button>
            <div className="mb-6">
                <h1 className="text-3xl font-headline text-primary tracking-wider">Manage Daily Rituals</h1>
                <p className="text-muted-foreground">View, edit, or remove the tasks that are created for you each day.</p>
            </div>

            {rituals.length > 0 ? (
                <div className="space-y-4">
                    {rituals.map((ritual) => (
                        <Card key={ritual.id} className="bg-card/70 flex items-center justify-between p-4">
                            <div>
                                <CardTitle className="text-lg">{ritual.title}</CardTitle>
                                <CardDescription>Importance: {ritual.importance} | Est. Time: {ritual.estimatedTime} min</CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                                {/* THE FIX IS HERE: Added the EditRitualDialog component */}
                                <EditRitualDialog ritual={ritual} />
                                <Button 
                                    variant="destructive" 
                                    size="icon"
                                    onClick={() => handleDeleteRitual(ritual.id, ritual.title)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-muted rounded-lg">
                    <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-xl font-headline text-primary">No Daily Rituals Found</h3>
                    <p className="text-muted-foreground mt-2">Create a new task and set the category to "Daily Rituals" to add one.</p>
                </div>
            )}
        </div>
    );
}
