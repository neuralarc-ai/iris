"use client";

import React, { useState, useEffect, useRef } from 'react';
import PageTitle from '@/components/common/PageTitle';
import { Button } from '@/components/ui/button';
import { PlusCircle, Edit, Eye, EyeOff as EyeOffIcon, Users2, Loader2, Trash2, RefreshCw } from 'lucide-react';
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
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';


const CreateUserForm = ({ onUserCreated, closeDialog }: { onUserCreated: (newUser: User) => void, closeDialog: () => void }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [animatedPinDisplay, setAnimatedPinDisplay] = useState<string[]>(Array(4).fill(''));
  const [isGeneratingPin, setIsGeneratingPin] = useState(false);
  const { toast } = useToast();
  const animationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const finalPinRef = useRef<string | null>(null);
  const [manualPin, setManualPin] = useState('');
  const [pinMode, setPinMode] = useState<'auto' | 'manual'>('auto');

  useEffect(() => {
    return () => { // Cleanup on unmount
      if (animationIntervalRef.current) {
        clearInterval(animationIntervalRef.current);
      }
    };
  }, []);

  // Helper to get all existing PINs (4 digits)
  const getAllPins = () => {
    return initialMockUsers.map(u => u.pin.slice(0, 4));
  };

  // Generate a unique 4-digit PIN
  const generateUniquePin = () => {
    const existingPins = new Set(getAllPins());
    let pin;
    let attempts = 0;
    do {
      pin = Math.floor(1000 + Math.random() * 9000).toString();
      attempts++;
    } while (existingPins.has(pin) && attempts < 1000);
    return pin;
  };

  const startPinAnimation = () => {
    setIsGeneratingPin(true);
    finalPinRef.current = generateUniquePin();
    let animationCount = 0;
    const totalAnimationFramesPerDigit = 5;
    let currentDigitAnimating = 0;
    animationIntervalRef.current = setInterval(() => {
      const newPinDisplay = [...animatedPinDisplay];
      newPinDisplay[currentDigitAnimating] = Math.floor(Math.random() * 10).toString();
      animationCount++;
      if (animationCount % totalAnimationFramesPerDigit === 0) {
        if (finalPinRef.current) {
          newPinDisplay[currentDigitAnimating] = finalPinRef.current[currentDigitAnimating];
        }
        currentDigitAnimating++;
      }
      setAnimatedPinDisplay(newPinDisplay);
      if (currentDigitAnimating >= 4) {
        if (animationIntervalRef.current) clearInterval(animationIntervalRef.current);
        setAnimatedPinDisplay(finalPinRef.current!.split(''));
        setTimeout(() => {
          const newUser = addUser(name, email, finalPinRef.current!);
          toast({
            title: "User Created Successfully!",
            description: (
              <div>
                <p>{newUser.name} has been added to the system.</p>
                <p className="font-semibold">Generated PIN: <span className="font-mono text-base">{finalPinRef.current}</span></p>
                <p className="text-xs text-muted-foreground mt-1">Please ensure the user notes down this PIN.</p>
              </div>
            ),
            duration: 7000,
          });
          onUserCreated(newUser);
          resetFormAndAnimation();
          closeDialog();
        }, 800);
      }
    }, 75);
  };
  
  const resetFormAndAnimation = () => {
    setName('');
    setEmail('');
    setAnimatedPinDisplay(Array(4).fill(''));
    setIsGeneratingPin(false);
    if (animationIntervalRef.current) {
      clearInterval(animationIntervalRef.current);
    }
    finalPinRef.current = null;
    setManualPin('');
    setPinMode('auto');
  };

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
    if (isGeneratingPin) return;
    // Manual mode: validate PIN
    if (pinMode === 'manual') {
      if (!/^[0-9]{4}$/.test(manualPin)) {
        toast({ title: "Error", description: "PIN must be 4 digits.", variant: "destructive" });
        return;
      }
      if (getAllPins().includes(manualPin)) {
        toast({ title: "Error", description: "PIN must be unique.", variant: "destructive" });
        return;
      }
      const newUser = addUser(name, email, manualPin);
      toast({
        title: "User Created Successfully!",
        description: (
          <div>
            <p>{newUser.name} has been added to the system.</p>
            <p className="font-semibold">PIN: <span className="font-mono text-base">{manualPin}</span></p>
            <p className="text-xs text-muted-foreground mt-1">Please ensure the user notes down this PIN.</p>
          </div>
        ),
        duration: 7000,
      });
      onUserCreated(newUser);
      resetFormAndAnimation();
      closeDialog();
      return;
    }
    startPinAnimation();
  };

  return (
    <DialogContent className='sm:max-w-sm md:p-8'>
      <DialogHeader>
        <DialogTitle className='sm:justify-center sm:text-center'>Create New User</DialogTitle>
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
          <div className="flex items-center justify-between w-full">
            <Label>PIN:</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className={`text-sm font-medium underline underline-offset-2 px-2 py-1 rounded hover:bg-[#F8F7F3] transition-colors ${pinMode === 'auto' ? 'text-primary' : 'text-muted-foreground'}`}
                    onClick={() => {
                      if (pinMode === 'auto') {
                        setPinMode('manual');
                        setManualPin('');
                      } else {
                        // Generate a unique 4-digit PIN and fill manualPin
                        const pin = generateUniquePin();
                        setManualPin(pin);
                      }
                    }}
                    tabIndex={0}
                  >
                    Generate PIN
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" align="center">
                  {pinMode === 'auto' ? 'Switch to manual PIN entry' : 'Auto-generate unique PIN'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="flex justify-center space-x-1 sm:space-x-2 h-20 items-center rounded-md p-1 sm:p-2">
            {pinMode === 'auto' ? (
              animatedPinDisplay.map((digit, index) => (
                <span
                  key={index}
                  className={`w-10 h-14 sm:w-12 sm:h-16 text-4xl sm:text-5xl font-mono border-2 flex items-center justify-center rounded-md bg-background shadow-inner 
                    transition-colors duration-100 ease-in-out
                    ${isGeneratingPin && (!finalPinRef.current || index >= (finalPinRef.current?.length || 0) || animatedPinDisplay[index] !== finalPinRef.current?.[index]) ? 'border-primary text-primary animate-pulse' : 
                      (finalPinRef.current && animatedPinDisplay.join('') === finalPinRef.current ? 'border-green-500 text-green-600' : 'border-input')
                    }
                  `}
                >
                  {digit || (isGeneratingPin ? '0' : '')} 
                </span>
              ))
            ) : (
              Array(4).fill(0).map((_, idx) => (
                <input
                  key={idx}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={manualPin[idx] || ''}
                  onChange={e => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 1);
                    setManualPin(prev => prev.substring(0, idx) + val + prev.substring(idx + 1));
                    // Focus next input
                    if (val && idx < 3) {
                      const next = document.getElementById(`manual-pin-${idx + 1}`);
                      if (next) (next as HTMLInputElement).focus();
                    }
                  }}
                  id={`manual-pin-${idx}`}
                  className="w-10 h-14 sm:w-12 sm:h-16 text-4xl sm:text-5xl font-mono border-2 flex items-center justify-center rounded-md bg-background shadow-inner text-center"
                  disabled={isGeneratingPin}
                />
              ))
            )}
          </div>
        </div>

        <DialogFooter className="pt-2 sm:justify-center">
          <DialogClose asChild>
            <Button type="button" variant="outline" onClick={() => {
              resetFormAndAnimation();
              closeDialog();
            }} disabled={isGeneratingPin}>Cancel</Button>
          </DialogClose>
          <Button type="submit" variant="add" disabled={isGeneratingPin}>
            {isGeneratingPin ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Create User"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
};

const EditUserDialog = ({ user, open, onOpenChange, onUserUpdated }: { user: User | null, open: boolean, onOpenChange: (open: boolean) => void, onUserUpdated: (updated: User) => void }) => {
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [pin, setPin] = useState(user?.pin || '');
  const { toast } = useToast();

  useEffect(() => {
    setName(user?.name || '');
    setEmail(user?.email || '');
    setPin(user?.pin || '');
  }, [user, open]);

  if (!user) return null;

  const handleSave = () => {
    if (!name.trim() || !email.trim() || !pin.trim() || pin.length !== 6) {
      toast({ title: 'Error', description: 'All fields are required and PIN must be 6 digits.', variant: 'destructive' });
      return;
    }
    user.name = name;
    user.email = email;
    user.pin = pin;
    onUserUpdated({ ...user });
    onOpenChange(false);
    toast({ title: 'User Updated', description: `${name}'s info has been updated.` });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-sm md:p-8'>
        <DialogHeader className='sm:items-center sm:justify-center'>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>Update user details and PIN.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label>Name</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Name" />
          </div>
          <div>
            <Label>Email</Label>
            <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" />
          </div>
          <div>
            <Label>PIN</Label>
            <Input value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0,6))} placeholder="6-digit PIN" maxLength={6} className="font-mono tracking-widest" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="add" onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};


export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isCreateUserDialogOpen, setIsCreateUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [pinVisibility, setPinVisibility] = useState<{ [userId: string]: boolean }>({});

  useEffect(() => {
    const adminUserIndex = initialMockUsers.findIndex(u => u.email === 'admin@iris.ai');
    if (adminUserIndex !== -1 && initialMockUsers[adminUserIndex].pin !== DEMO_PIN) {
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

  const handleUserUpdated = (updated: User) => {
    setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
  };

  const handleDeleteUser = (user: User) => {
    setDeletingUser(user);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteUser = () => {
    if (deletingUser) {
      setUsers(prev => prev.filter(u => u.id !== deletingUser.id));
      setDeletingUser(null);
      setIsDeleteDialogOpen(false);
    }
  };

  const handleCreateUserDialogChange = (open: boolean) => {
    setIsCreateUserDialogOpen(open);
    // If dialog is closed, ensure any running animation in CreateUserForm is reset
    // CreateUserForm has its own reset for animation state via its resetFormAndAnimation
  };


  return (
    <div className="max-w-[1440px] mx-auto">
      <PageTitle title="User Management" subtitle="Create and manage user accounts and PINs.">
        <Dialog open={isCreateUserDialogOpen} onOpenChange={handleCreateUserDialogChange}>
          <DialogTrigger asChild>
            <Button variant="add" className="w-fit">
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
        <CardContent className="p-0">
          {users.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="bg-[#CBCAC5] hover:bg-[#CBCAC5]">
                  <TableHead className="text-[#282828] w-8 text-center">#</TableHead>
                  <TableHead className="text-[#282828]">Name</TableHead>
                  <TableHead className="text-[#282828]">Email</TableHead>
                  <TableHead className="text-[#282828] text-center">Role</TableHead>
                  <TableHead className="text-[#282828] text-center">PIN</TableHead>
                  <TableHead className="text-[#282828] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user, idx) => (
                  <TableRow key={user.id} className="hover:bg-transparent bg-transparent">
                    <TableCell className="text-center text-muted-foreground font-mono">{idx + 1}</TableCell>
                    <TableCell className="font-medium text-foreground">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell className="text-center">
                      <span className={`inline-block rounded-full w-16 px-3 py-1 text-xs font-semibold ${user.email === 'admin@iris.ai' ? 'bg-[#b0aca7] text-[#23201d]' : 'bg-[#CFD4C9] text-[#282828]'}`}>
                        {user.email === 'admin@iris.ai' ? 'Admin' : 'User'}
                      </span>
                    </TableCell>
                    <TableCell className="text-center font-mono tracking-widest flex items-center justify-center gap-2">
                      {pinVisibility[user.id] ? user.pin : '••••••'}
                      <button
                        type="button"
                        aria-label={pinVisibility[user.id] ? 'Hide PIN' : 'Show PIN'}
                        className="ml-1 p-1 rounded hover:bg-[#E6E8E3] focus:bg-[#E6E8E3] transition-colors"
                        onClick={() => setPinVisibility(v => ({ ...v, [user.id]: !v[user.id] }))}
                      >
                        {pinVisibility[user.id] ? (
                          <EyeOffIcon className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </button>
                    </TableCell>
                    <TableCell className="text-right align-middle">
                      <div className="flex items-center gap-2 justify-end">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="rounded-[6px] p-0 w-9 h-9 bg-white border border-[#E6E8E3] hover:bg-white/80 shadow-sm focus:shadow-md flex items-center justify-center"
                          onClick={() => { setEditingUser(user); setIsEditUserDialogOpen(true); }}
                          aria-label="Edit"
                        >
                          <Edit className="h-4 w-4 text-[#282828]" />
                        </Button>
                        <AlertDialog open={isDeleteDialogOpen && deletingUser?.id === user.id} onOpenChange={open => { if (!open) setDeletingUser(null); setIsDeleteDialogOpen(open); }}>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="icon"
                              className="rounded-[6px] p-0 w-9 h-9 bg-[#916D5B] hover:bg-[#916D5B]/80 shadow-sm focus:shadow-md flex items-center justify-center border-0"
                              aria-label="Delete"
                            >
                              <Trash2 className="h-4 w-4 text-white" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete User?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete {user.name}? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={confirmDeleteUser} className="bg-[#916D5B] text-white rounded-[4px] border-0 hover:bg-[#a98a77]">Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
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

      <EditUserDialog
        user={editingUser}
        open={isEditUserDialogOpen}
        onOpenChange={setIsEditUserDialogOpen}
        onUserUpdated={handleUserUpdated}
      />
    </div>
  );
}

    