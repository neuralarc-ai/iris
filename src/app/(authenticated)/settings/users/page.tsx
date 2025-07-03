"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import PageTitle from '@/components/common/PageTitle';
import { Button } from '@/components/ui/button';
import { PlusCircle, Edit, Eye, EyeOff as EyeOffIcon, Users2, Loader2, Trash2 } from 'lucide-react';
import type { User as BaseUser } from '@/types';
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
import { Card, CardContent } from '@/components/ui/card';
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { supabase } from '@/lib/supabaseClient';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import Avvvatars from 'avvvatars-react';

// Extend User type to ensure 'role' property exists
interface User extends BaseUser {
  role: string;
  created_at: string;
}

const CreateUserForm = ({ onUserCreated, closeDialog }: { onUserCreated: () => void, closeDialog: () => void }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [role, setRole] = useState<'admin' | 'user'>('user');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const PIN_LENGTH = 4;

  // Generate a unique 4-digit PIN
  const generatePin = () => Math.floor(1000 + Math.random() * 9000).toString();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !pin.trim() || pin.length !== PIN_LENGTH) {
      toast({ title: "Error", description: "All fields are required and PIN must be 4 digits.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    const { error } = await supabase.from('users').insert([{ name, email, pin, role }]);
    setIsLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "User Created Successfully!", description: `${name} has been added to the system.`, duration: 7000 });
    onUserCreated();
    setName('');
    setEmail('');
    setPin('');
    setRole('user');
    closeDialog();
  };

  return (
    <DialogContent className='sm:max-w-sm md:p-8'>
      <DialogHeader>
        <DialogTitle className='sm:justify-center sm:text-center'>Create New User</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4 pt-4">
        <div>
          <Label htmlFor="create-name">Name</Label>
          <Input id="create-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter user's name" disabled={isLoading} />
        </div>
        <div>
          <Label htmlFor="create-email">Email</Label>
          <Input id="create-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter user's email" disabled={isLoading} />
        </div>
        <div>
          <Label htmlFor="create-pin">PIN</Label>
          <div className="flex gap-2 items-center">
            <Input id="create-pin" value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0,PIN_LENGTH))} placeholder="4-digit PIN" maxLength={PIN_LENGTH} className="font-mono tracking-widest" disabled={isLoading} />
            <Button type="button" variant="outline" onClick={() => setPin(generatePin())} disabled={isLoading}>Generate</Button>
          </div>
        </div>
        <div>
          <Label htmlFor="create-role">Role</Label>
          <select id="create-role" value={role} onChange={e => setRole(e.target.value as 'admin' | 'user')} className="w-full border rounded p-2" disabled={isLoading}>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <DialogFooter className="pt-2 sm:justify-center">
          <DialogClose asChild>
            <Button type="button" variant="outline" onClick={closeDialog} disabled={isLoading}>Cancel</Button>
          </DialogClose>
          <Button type="submit" variant="add" disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Create User"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
};

const EditUserDialog = ({ user, open, onOpenChange, onUserUpdated }: { user: User | null, open: boolean, onOpenChange: (open: boolean) => void, onUserUpdated: () => void }) => {
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [pin, setPin] = useState(user?.pin || '');
  const [role, setRole] = useState<'admin' | 'user'>(user?.role as 'admin' | 'user' || 'user');
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const PIN_LENGTH = 4;

  useEffect(() => {
    setName(user?.name || '');
    setEmail(user?.email || '');
    setPin(user?.pin || '');
    setRole(user?.role as 'admin' | 'user' || 'user');
  }, [user, open]);

  if (!user) return null;

  const handleSave = async () => {
    if (!name.trim() || !email.trim() || !pin.trim() || pin.length !== PIN_LENGTH) {
      toast({ title: 'Error', description: 'All fields are required and PIN must be 4 digits.', variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    const { error } = await supabase.from('users').update({ name, email, pin, role }).eq('id', user.id);
    setIsLoading(false);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'User Updated', description: `${name}'s info has been updated.` });
    onUserUpdated();
    onOpenChange(false);
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
            <Input value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0,PIN_LENGTH))} placeholder="4-digit PIN" maxLength={PIN_LENGTH} className="font-mono tracking-widest" />
          </div>
          <div>
            <Label>Role</Label>
            <select value={role} onChange={e => setRole(e.target.value as 'admin' | 'user')} className="w-full border rounded p-2">
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="add" onClick={handleSave} disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default function UserManagementPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [isCreateUserDialogOpen, setIsCreateUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [visiblePinUserId, setVisiblePinUserId] = useState<string | null>(null);
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const PIN_LENGTH = 4;
  const [checkingRole, setCheckingRole] = useState(true);
  const [search, setSearch] = useState('');

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(search.toLowerCase()) ||
    user.email.toLowerCase().includes(search.toLowerCase())
  );

  const fetchUsers = async () => {
    setIsLoading(true);
    const { data, error } = await supabase.from('users').select('*, created_at').order('created_at', { ascending: false });
    setIsLoading(false);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }
    setUsers(data || []);
  };

  useEffect(() => {
    const checkAdmin = async () => {
      const userId = localStorage.getItem('user_id');
      if (!userId) {
        router.replace('/login');
        return;
      }
      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();
      if (error || !data || data.role !== 'admin') {
        router.replace('/dashboard');
        return;
      }
      setCheckingRole(false);
    };
    checkAdmin();
  }, [router]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleUserCreated = () => {
    fetchUsers();
  };

  const handleUserUpdated = () => {
    fetchUsers();
  };

  const handleDeleteUser = (user: User) => {
    setDeletingUser(user);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteUser = async () => {
    if (deletingUser) {
      setIsLoading(true);
      const { error } = await supabase.from('users').delete().eq('id', deletingUser.id);
      setIsLoading(false);
      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
        return;
      }
      toast({ title: 'User Deleted', description: `${deletingUser.name} has been deleted.` });
      setDeletingUser(null);
      setIsDeleteDialogOpen(false);
      fetchUsers();
    }
  };

  const handleCreateUserDialogChange = (open: boolean) => {
    setIsCreateUserDialogOpen(open);
  };

  if (checkingRole) {
    return <div className="flex justify-center items-center h-96"><LoadingSpinner /></div>;
  }

  return (
    <div className="max-w-[1440px] mx-auto">
      <PageTitle title="User Management" subtitle="Create and manage user accounts and PINs.">
        <div className="flex flex-row gap-4 items-center w-full">
          <Input
            type="text"
            placeholder="Search Name, Email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-64 py-[23px] rounded-sm"
          />
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
        </div>
      </PageTitle>

      <Card className='shadow-none border-none rounded-t-md'>
        <CardContent className="p-0 shadow-none rounded-t-md overflow-hidden">
          {isLoading ? (
            <div className="p-6 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></div>
          ) : filteredUsers.length > 0 ? (
            <Table className='rounded-t-md'>
              <TableHeader className='rounded-t-md'>
                <TableRow style={{ background: '#C5DAE5' }} className='rounded-t-md'>
                  <TableHead className="text-[#282828] w-8 text-center">#</TableHead>
                  <TableHead className="text-[#282828] w-8 text-center">Avatar</TableHead>
                  <TableHead className="text-[#282828]">User Name</TableHead>
                  <TableHead className="text-[#282828]">Email</TableHead>
                  <TableHead className="text-[#282828] text-center">PIN</TableHead>
                  <TableHead className="text-[#282828] text-center">Role</TableHead>
                  <TableHead className="text-[#282828] text-center">Created At</TableHead>
                  <TableHead className="text-[#282828] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user, idx) => (
                  <TableRow key={user.id} className="hover:bg-transparent bg-transparent">
                    <TableCell className="text-center text-muted-foreground font-mono">{idx + 1}</TableCell>
                    <TableCell className="text-center">
                      <Avvvatars value={user.email || user.name} size={36} style="shape" radius={4} />
                    </TableCell>
                    <TableCell className="font-medium text-foreground">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell className="text-center font-mono tracking-widest flex items-center justify-center gap-2">
                      {visiblePinUserId === user.id ? user.pin : '••••'}
                      <button
                        type="button"
                        aria-label={visiblePinUserId === user.id ? 'Hide PIN' : 'Show PIN'}
                        className="ml-1 p-1 rounded hover:bg-[#E6E8E3] focus:bg-[#E6E8E3] transition-colors"
                        onClick={() => setVisiblePinUserId(visiblePinUserId === user.id ? null : user.id)}
                      >
                        {visiblePinUserId === user.id ? (
                          <EyeOffIcon className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </button>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={`inline-block rounded-full w-16 px-3 py-1 text-xs font-semibold ${user.role === 'admin' ? 'bg-[#b0aca7] text-[#23201d]' : 'bg-[#CFD4C9] text-[#282828]'}`}>
                        {user.role === 'admin' ? 'Admin' : 'User'}
                      </span>
                    </TableCell>
                    <TableCell className="text-center font-mono text-xs text-muted-foreground">
                      {user.created_at ? new Date(user.created_at).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
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

    