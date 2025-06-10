"use client";

import React, { useState, useEffect } from 'react';
import PageTitle from '@/components/common/PageTitle';
import { Button } from '@/components/ui/button';
import { PlusCircle, Edit, Eye, EyeOff as EyeOffIcon, Users2 } from 'lucide-react';
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
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      toast({ title: "Error", description: "Name and email are required.", variant: "destructive" });
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      toast({ title: "Error", description: "Please enter a valid email address.", variant: "destructive" });
      return;
    }
    const newUser = addUser(name, email);
    toast({ 
      title: "User Created", 
      description: (
        <div>
          <p>{newUser.name} has been added.</p>
          <p className="font-mono">Generated PIN: {newUser.pin}</p>
        </div>
      )
    });
    onUserCreated(newUser);
    setName('');
    setEmail('');
    closeDialog();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
      <div>
        <Label htmlFor="create-name">Name</Label>
        <Input id="create-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter user's name" />
      </div>
      <div>
        <Label htmlFor="create-email">Email</Label>
        <Input id="create-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter user's email" />
      </div>
      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="outline">Cancel</Button>
        </DialogClose>
        <Button type="submit">Create User</Button>
      </DialogFooter>
    </form>
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
    // Ensure admin user has the latest DEMO_PIN from constants on initial load
    const adminUserIndex = initialMockUsers.findIndex(u => u.email === 'admin@iris.ai');
    if (adminUserIndex !== -1) {
      initialMockUsers[adminUserIndex].pin = DEMO_PIN;
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
