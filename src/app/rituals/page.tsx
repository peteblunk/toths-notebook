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
import { EditRitualTemplateDialog } from '@/components/edit-ritual-template-dialog';
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
            <Button asChild variant="ghost" className="mb-4 text-primary hover:text-primary-10">
                <Link href="/">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Return to Main Hall
                </Link>
            </Button>
            <div className="mb-6 border-b border-cyan-900/50 pb-4">
                <h1 className="text-3xl font-headline text-primary tracking-wider">Manage Daily Rituals</h1>
                <p className="text-muted-foreground">View, edit, or banish the tasks that are created for you each day.</p>
            </div>

            {rituals.length > 0 ? (
                <div className="space-y-4">
                    {rituals.map((ritual) => (
                        <Card
                            key={ritual.id}
                            /* TRIMMED BUFFER: Reduced p-4 to p-2 on mobile, p-3 on desktop */
                            className="bg-card border-border flex items-center justify-between p-2 sm:p-3 hover:border-accent transition-colors group overflow-hidden"
                        >
                            <div className="flex-1 min-w-0 pr-2"> {/* Added min-w-0 to prevent text from pushing icons off-screen */}
                                <CardTitle className="font-body font-bold text-base sm:text-lg text-foreground truncate">
                                    {ritual.title}
                                </CardTitle>
                                <CardDescription className="text-[10px] sm:text-xs text-slate-400 truncate">
                                </CardDescription>
                            </div>

                            {/* ACTION BUTTONS: Tightened gap to allow larger icons */}
                            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                                {/* STYLUS BUTTON */}
                                <div
                                    role="button"
                                    onClick={() => handleEditClick(ritual)}
                                    className={cn(
                                        "group/stylus cursor-pointer flex items-center justify-center p-1 rounded-lg transition-all active:scale-95",
                                        "border-2 border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.2)] bg-black"
                                    )}
                                >
                                    {/* INCREASED ICON SIZE: w-12 to w-14/16 */}
                                    <CyberStylus className="w-14 h-14 sm:w-20 sm:h-20 text-cyan-400 drop-shadow-[0_0_5px_rgba(34,211,238,0.8)]" />
                                </div>

                                {/* JAR BUTTON */}
                                <div
                                    role="button"
                                    onClick={() => handleDeleteClick(ritual)}
                                    className={cn(
                                        "group/modal-jar cursor-pointer flex items-center justify-center p-1 rounded-lg transition-all active:scale-95",
                                        "border-2 border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.2)] bg-black"
                                    )}
                                >
                                    {/* INCREASED ICON SIZE: w-12 to w-14/16 */}
                                    <DuamatefJar className="w-14 h-14 sm:w-20 sm:h-20 text-red-500 drop-shadow-[0_0_5px_rgba(239,68,68,0.8)]" />
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
                <EditRitualTemplateDialog
                    task={selectedRitual}
                    open={isEditOpen}
                    onOpenChange={setIsEditOpen}
                />
            )}

            {/* THE BANISHMENT DIALOG */}
            <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                {/* PURIFIED VOID: Changed bg-slate-950 to bg-black for total void */}
                <AlertDialogContent className="bg-black border-destructive text-slate-50 rounded-lg shadow-[0_0_50px_rgba(239,68,68,0.2)]">
                    <AlertDialogContent className="bg-black border-destructive text-slate-50 rounded-lg shadow-[0_0_50px_rgba(239,68,68,0.2)] min-h-[80vh] flex flex-col justify-between p-8">

                        {/* TOP: The Sacred Icon claims the upper void */}
                        <div className="flex-1 flex items-center justify-center">
                            <DuamatefHead className="w-80 h-80 text-destructive brightness-125" />
                        </div>

                        {/* BOTTOM: The Action Zone (Text + Buttons) */}
                        <div className="space-y-2">
                            <AlertDialogHeader className="flex flex-col items-center text-center p-0">
                                <AlertDialogTitle className="font-headline text-destructive text-2xl tracking-[0.3em] brightness-150 p-0">
                                    Banish Ritual?
                                </AlertDialogTitle>

                                <AlertDialogDescription className="text-slate-300 font-body brightness-110 text-xs max-w-[250px]">
                                    Confirm Daily Ritual no longer supports Ma'at.
                                </AlertDialogDescription>
                            </AlertDialogHeader>

                            <AlertDialogFooter className="mt-6">
                                <div className="flex flex-col sm:flex-row-reverse gap-4 w-full justify-center items-center">
                                    <AlertDialogAction
                                        onClick={handleDeleteRitual}
                                        className="w-full sm:w-auto sm:min-w-[160px] h-12 bg-black text-destructive font-headline border-2 border-destructive hover:bg-destructive/20 hover:text-destructive brightness-125 uppercase tracking-[0.2em] text-[11px] flex items-center justify-center transition-all opacity-100"
                                    >
                                        Confirm Banishment
                                    </AlertDialogAction>

                                    <AlertDialogCancel
                                        className="w-full sm:w-auto sm:min-w-[160px] h-12 bg-black text-primary font-headline border-2 border-primary hover:bg-primary/20 hover:text-primary mt-0 sm:mt-0 brightness-125 uppercase tracking-[0.2em] text-[11px] flex items-center justify-center transition-all opacity-100"
                                    >
                                        Preserve Ritual
                                    </AlertDialogCancel>
                                </div>
                            </AlertDialogFooter>
                        </div>
                    </AlertDialogContent>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}