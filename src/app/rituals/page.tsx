"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, BookOpen } from 'lucide-react'; 
import { collection, query, where, onSnapshot, deleteDoc, doc } from 'firebase/firestore';

import { db } from '@/lib/firebase';
import { useAuth } from '@/components/auth-provider';
import { Button } from '@/components/ui/button';
import { Card, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import type { Task } from '@/lib/types';
import { EditRitualDialog } from '@/components/edit-ritual-dialog';
// 👇 NEW IMPORTS
import { DuamatefJar } from '@/components/icons/duamatef-jar';
import { CyberStylus } from '@/components/icons/cyber-stylus';
import { cn } from '@/lib/utils';
import { DuamatefHead } from '@/components/icons/duamatef-head';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function ManageRitualsPage() {
    const [rituals, setRituals] = useState<Task[]>([]);
    const { user } = useAuth();
    const { toast } = useToast();

    // State to manage the Editing Dialog
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [selectedRitual, setSelectedRitual] = useState<Task | null>(null);

    // State to manage the Deleting Dialog
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [ritualToDelete, setRitualToDelete] = useState<Task | null>(null);

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

    const handleDeleteRitual = async () => {
        if (!ritualToDelete) return;

        const ritualDocRef = doc(db, 'dailyRituals', ritualToDelete.id);
        try {
            await deleteDoc(ritualDocRef);
            toast({
                title: "Ritual Banished",
                description: `"${ritualToDelete.title}" has been removed from your daily templates.`,
            });
        } catch (error) {
            console.error("Error deleting ritual: ", error);
            toast({ title: "Error", description: "Could not delete ritual.", variant: 'destructive' });
        } finally {
            setIsDeleteOpen(false);
            setRitualToDelete(null);
        }
    };

    const handleEditClick = (ritual: Task) => {
        setSelectedRitual(ritual);
        setIsEditOpen(true);
    };

    const handleDeleteClick = (ritual: Task) => {
        setRitualToDelete(ritual);
        setIsDeleteOpen(true);
    };

    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-4xl">
            <Button asChild variant="ghost" className="mb-4 text-cyan-400 hover:text-cyan-300">
                <Link href="/">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Tasks
                </Link>
            </Button>
            <div className="mb-6 border-b border-cyan-900/50 pb-4">
                <h1 className="text-3xl font-headline text-primary tracking-wider">Manage Daily Rituals</h1>
                <p className="text-muted-foreground">View, edit, or banish the tasks that are created for you each day.</p>
            </div>

            {rituals.length > 0 ? (
                <div className="space-y-4">
                    {rituals.map((ritual) => (
                        <Card key={ritual.id} className="bg-slate-900/80 border-cyan-900/50 flex items-center justify-between p-4 hover:border-cyan-500/50 transition-colors group">
                            <div>
                                <CardTitle className="text-lg text-cyan-50 group-hover:text-cyan-400 transition-colors">{ritual.title}</CardTitle>
                                <CardDescription className="text-slate-400">
                                    Importance: <span className="capitalize text-cyan-400">{ritual.importance}</span> | 
                                    Est. Time: <span className="text-cyan-400">{ritual.estimatedTime} min</span>
                                </CardDescription>
                            </div>
                            
                            {/* ACTION BUTTONS (Cyber Style) */}
                            <div className="flex items-center gap-3">
                                
                                {/* EDIT BUTTON (Cyber Stylus) */}
                                <div 
                                    role="button"
                                    onClick={() => handleEditClick(ritual)}
                                    className={cn(
                                        "group/stylus cursor-pointer",
                                        "flex items-center justify-center p-2 rounded-md",
                                        "text-cyan-500 hover:bg-cyan-950/30",
                                        "transition-all duration-300 active:scale-95"
                                    )}
                                    title="Edit Ritual"
                                >
                                    <CyberStylus className="w-32 h-32" />
                                </div>

                                {/* DELETE BUTTON (Cyber Jar) */}
                                <div 
                                    role="button"
                                    onClick={() => handleDeleteClick(ritual)}
                                    className={cn(
                                        "group/modal-jar cursor-pointer",
                                        "flex items-center justify-center p-2 rounded-md",
                                        "text-red-500 hover:bg-red-950/30",
                                        "transition-all duration-300 active:scale-95"
                                    )}
                                    title="Banish Ritual"
                                >
                                    <DuamatefJar className="w-32 h-32" />
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-cyan-900/30 rounded-lg bg-slate-900/20">
                    <BookOpen className="h-12 w-12 text-cyan-800 mb-4" />
                    <h3 className="text-xl font-headline text-cyan-600">No Daily Rituals Found</h3>
                    <p className="text-slate-500 mt-2 max-w-md">Create a new task and set the category to "Daily Rituals" to have the Midnight Scribe automate it for you.</p>
                </div>
            )}

            {/* THE EDIT DIALOG */}
            {selectedRitual && (
                <EditRitualDialog 
                    task={selectedRitual} 
                    open={isEditOpen} 
                    onOpenChange={setIsEditOpen} 
                />
            )}

            {/* THE BANISHMENT DIALOG */}
            <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <AlertDialogContent className="bg-slate-950 border-destructive text-slate-50 rounded-lg">
                    <AlertDialogHeader className="flex flex-col items-center text-center">
                        <DuamatefHead className="w-72 h-72 text-destructive -mb-12" />
                        <AlertDialogTitle className="font-headline text-destructive p-5">Banish Ritual?</AlertDialogTitle>
                        <AlertDialogDescription className="text-slate-400 font-body">
                            Confirm this Daily Ritual no longer supports Ma'at.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="bg-black text-primary font-headline border border-primary hover:bg-primary/10">Preserve Ritual</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteRitual} className="bg-black text-destructive font-headline border border-destructive hover:bg-destructive/10">Confirm Banishment</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}