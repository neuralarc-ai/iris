"use client";

import React, { useState, useEffect, useRef } from 'react';
import PageTitle from '@/components/common/PageTitle';
import { Button } from '@/components/ui/button';
import { PlusCircle, Edit, Eye, EyeOff as EyeOffIcon, Users2, Loader2 } from 'lucide-react';
import { mockUsers as initialMockUsers, addUser, updateUserPin } from '@/lib/data';
import type { User } from '@/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DEMO_PIN } from '@/lib/constants';


const CreateUserForm = ({ onUserCreated, closeDialog }: { onUserCreated: (newUser: User) => void, closeDialog: () => void }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [animatedPinDisplay, setAnimatedPinDisplay] = useState<string[]>(Array(6).fill('-'));
  const [isGeneratingPin, setIsGeneratingPin] = useState(false);
  const { toast } = useToast();
  const animationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasAnimatedRef = useRef(false); // To prevent re-animation on re-renders if dialog stays open

  useEffect(() => {
    // Reset when dialog opens/closes or form submits
    if (!isGeneratingPin) {
      setAnimatedPinDisplay(Array(6).fill('-'));
      hasAnimatedRef.current = false;
    }
    return () => {
      if (animationIntervalRef.current) {
        clearInterval(animationIntervalRef.current);
      }
    };
  }, [isGeneratingPin, closeDialog]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      toast({ title: "Error", description: "Name and email are required.", variant: "destructive" });
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      toast({ title: "Error", description: "Please enter a valid email address.", variant: "destructive" });
      return;
    }

    if (hasAnimatedRef.current) return; // Don't re-animate if already done for this submission

    setIsGeneratingPin(true);
    hasAnimatedRef.current = true;
    let animationCount = 0;
    const totalAnimationFrames = 30; // 3 seconds at 100ms interval

    animationIntervalRef.current = setInterval(() => {
      setAnimatedPinDisplay(Array(6).fill(0).map(() => Math.floor(Math.random() * 10).toString()));
      animationCount++;
      if (animationCount >= totalAnimationFrames) {
        if (animationIntervalRef.current) clearInterval(animationIntervalRef.current);
        const finalPin = Math.floor(100000 + Math.random() * 900000).toString();
        setAnimatedPinDisplay(finalPin.split(''));
        
        // Short delay to allow user to see the final PIN before toast and close
        setTimeout(() => {
          const newUser = addUser(name, email, finalPin);
          toast({
            title: "User Created Successfully!",
            description: (
              <div>
                <p>{newUser.name} has been added to the system.</p>
                <p className="font-semibold">Generated PIN: <span className="font-mono text-base">{finalPin}</span></p>
                <p className="text-xs text-muted-foreground mt-1">Please ensure the user notes down this PIN.</p>
              </div>
            ),
            duration: 7000, // Longer duration for PIN visibility
          });
          onUserCreated(newUser);
          setName('');
          setEmail('');
          setIsGeneratingPin(false); 
          closeDialog();
        }, 500);
      }
    }, 100);
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Create New User</DialogTitle>
        <DialogDescription>Enter the user's details. A 6-digit PIN will be automatically generated.</DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4 pt-4">
        <div>
          <Label htmlFor="create-name">Name</Label>
          <Input id="create-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter user's name" disabled={isGeneratingPin} />
        </div>
        <div>
          <Label htmlFor="create-email">Email</Label>
          <Input id="create-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter user's email" disabled={isGeneratingPin} />
        </div>
        
        <div className="space-y-2 pt-2">
          <Label>Generated PIN:</Label>
          <div className="flex justify-center space-x-2 h-16 items-center bg-muted rounded-md p-3">
            {animatedPinDisplay.map((digit, index) => (
              <span
                key={index}
                className={`w-10 h-12 text-3xl font-mono border-2 flex items-center justify-center rounded-md bg-background shadow-inner transition-all duration-100 ease-in-out
                  ${isGeneratingPin && index === Math.floor(Math.random() * 6) ? 'animate-pulse border-primary scale-105' : 'border-input'}
                  ${!isGeneratingPin && animatedPinDisplay.join('') !== '------' ? 'border-green-500' : ''}
                `}
              >
                {digit}
              </span>
            ))}
          </div>
          {isGeneratingPin && <p className="text-xs text-center text-muted-foreground">Generating secure PIN...</p>}
        </div>

        <DialogFooter className="pt-2">
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={isGeneratingPin}>Cancel</Button>
          </DialogClose>
          <Button type="submit" disabled={isGeneratingPin}>
            {isGeneratingPin ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Create User"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
};

const EditPinDialog = ({ user, onPinUpdated, open, onOpenChange }: { user: User | null, onPinUpdated: () => void, open: boolean, onOpenChange: (open: boolean) => void }) => {
  const [newPin, setNewPin] = useState('');
  const [currentPinVisible, setCurrentPinVisible] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      setNewPin(''); 
    }
  }, [user, open]);

  const handleUpdatePin = () => {
    if (!user || !newPin || newPin.length !== 6 || !/^\d{6}$/.test(newPin)) {
      toast({ title: "Error", description: "PIN must be 6 digits and contain only numbers.", variant: "destructive" });
      return;
    }
    updateUserPin(user.id, newPin);
    toast({ title: "PIN Updated", description: `PIN for ${user.name} has been changed to ${newPin}.` });
    onPinUpdated();
    onOpenChange(false);
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Manage PIN for {user.name}</DialogTitle>
          <DialogDescription>View or update the 6-digit PIN for this user.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex items-center justify-between">
            <Label>Current PIN:</Label>
            <div className="flex items-center gap-2">
              <span className="font-mono text-lg tracking-widest">
                {currentPinVisible ? user.pin : "••••••"}
              </span>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentPinVisible(!currentPinVisible)}>
                {currentPinVisible ? <EyeOffIcon className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                <span className="sr-only">{currentPinVisible ? "Hide PIN" : "Show PIN"}</span>
              </Button>
            </div>
          </div>
          <div>
            <Label htmlFor="edit-newPin">New 6-Digit PIN</Label>
            <Input 
              id="edit-newPin" 
              value={newPin} 
              onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0,6))} 
              placeholder="Enter new 6-digit PIN" 
              maxLength={6}
              className="font-mono tracking-widest"
            />
          </div>
        </div>
        <DialogFooter>
           <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
           <Button onClick={handleUpdatePin}>Update PIN</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};


export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isCreateUserDialogOpen, setIsCreateUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isEditPinDialogOpen, setIsEditPinDialogOpen] = useState(false);

  useEffect(() => {
    const adminUserIndex = initialMockUsers.findIndex(u => u.email === 'admin@iris.ai');
    if (adminUserIndex !== -1 && initialMockUsers[adminUserIndex].pin !== DEMO_PIN) {
      initialMockUsers[adminUserIndex].pin = DEMO_PIN; // Ensure admin has demo pin on load if it differs
    }
    setUsers([...initialMockUsers]);
  }, []);
  
  const refreshUsersState = () => {
    setUsers([...initialMockUsers]); 
  };

  const handleUserCreated = (newUser: User) => {
    refreshUsersState();
  };

  const handlePinUpdated = () => {
    refreshUsersState();
    setEditingUser(null); 
  };
  
  const handleOpenEditDialog = (user: User) => {
    setEditingUser(user);
    setIsEditPinDialogOpen(true);
  };

  return (
    <div className="container mx-auto">
      <PageTitle title="User Management" subtitle="Create and manage user accounts and PINs.">
        <Dialog open={isCreateUserDialogOpen} onOpenChange={setIsCreateUserDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> Add New User
            </Button>
          </DialogTrigger>
          <CreateUserForm 
            onUserCreated={handleUserCreated} 
            closeDialog={() => setIsCreateUserDialogOpen(false)} 
          />
        </Dialog>
      </PageTitle>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center"><Users2 className="mr-2 h-6 w-6 text-primary" /> User Accounts</CardTitle>
          <CardDescription>Overview of all registered users in the system.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {users.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-center">PIN (Visible to Admin)</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell className="text-center font-mono tracking-widest">{user.pin}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => handleOpenEditDialog(user)}>
                        <Edit className="mr-1.5 h-3.5 w-3.5" /> Manage PIN
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="p-6 text-center text-muted-foreground">No users found.</p>
          )}
        </CardContent>
      </Card>
      
      <EditPinDialog 
        user={editingUser} 
        onPinUpdated={handlePinUpdated} 
        open={isEditPinDialogOpen}
        onOpenChange={setIsEditPinDialogOpen}
      />
    </div>
  );
}
