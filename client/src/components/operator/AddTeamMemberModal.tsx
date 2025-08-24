import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { User, UserPlus, Briefcase, Shield, CheckCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

interface AddTeamMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddTeamMemberModal({ isOpen, onClose }: AddTeamMemberModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    status: 'available'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.role.trim()) {
      toast({
        title: '⚠️ Missing Information',
        description: 'Name and role are required fields.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const memberData = {
        name: formData.name.trim(),
        role: formData.role.trim(),
        status: formData.status
      };

      const response = await fetch('/api/team-members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(memberData)
      });

      if (!response.ok) {
        throw new Error('Failed to add team member');
      }

      queryClient.invalidateQueries({ queryKey: ['/api/team-members'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard-stats'] });
      
      toast({
        title: '✅ Team Member Added',
        description: `${formData.name} has been successfully added to the emergency response team`,
      });

      setFormData({
        name: '',
        role: '',
        status: 'available'
      });
      onClose();
    } catch (error) {
      toast({
        title: '❌ Addition Failed',
        description: 'Unable to add team member. Please check the details and try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({
        name: '',
        role: '',
        status: 'available'
      });
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-white dark:bg-slate-900 border-0 shadow-2xl w-[95vw] max-w-md mx-auto rounded-2xl max-h-[90vh] overflow-y-auto" data-testid="add-team-member-modal">
      
        <DialogHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 sm:p-6 -m-6 mb-0">
          <DialogTitle className="flex items-center space-x-3 sm:space-x-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0">
              <UserPlus className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg sm:text-xl font-bold truncate">Add Team Member</h2>
              <p className="text-blue-100 text-xs sm:text-sm font-normal">Add a new member</p>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <div className="p-4 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-6" data-testid="add-team-member-form">
        
            <div className="space-y-4">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Required Information</span>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="memberName" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center space-x-2">
                    <User className="h-4 w-4 text-blue-600" />
                    <span>Full Name</span>
                    <Badge className="bg-red-100 text-red-800 text-xs px-1.5 py-0.5">Required</Badge>
                  </Label>
                  <Input
                    id="memberName"
                    placeholder="Enter full name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="h-12 sm:h-14 border-2 border-gray-200 focus:border-blue-500 rounded-xl text-base"
                    disabled={isSubmitting}
                    data-testid="input-member-name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="memberRole" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center space-x-2">
                    <Briefcase className="h-4 w-4 text-blue-600" />
                    <span>Role</span>
                    <Badge className="bg-red-100 text-red-800 text-xs px-1.5 py-0.5">Required</Badge>
                  </Label>
                  <Input
                    id="memberRole"
                    placeholder="Member role/position"
                    value={formData.role}
                    onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                    className="h-12 sm:h-14 border-2 border-gray-200 focus:border-blue-500 rounded-xl text-base"
                    disabled={isSubmitting}
                    data-testid="input-member-role"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="memberStatus" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center space-x-2">
                  <Shield className="h-4 w-4 text-blue-600" />
                  <span>Initial Status</span>
                </Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                  disabled={isSubmitting}
                >
                  <SelectTrigger className="h-12 sm:h-14 border-2 border-gray-200 focus:border-blue-500 rounded-xl text-base" data-testid="select-member-status">
                    <SelectValue placeholder="Select initial status" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-2 shadow-xl z-[9999] bg-white dark:bg-slate-800 backdrop-blur-sm">
                    <SelectItem value="available" className="rounded-lg text-base py-3">✅ Available</SelectItem>
                    <SelectItem value="on_duty" className="rounded-lg text-base py-3">🟢 On Duty</SelectItem>
                    <SelectItem value="off_duty" className="rounded-lg text-base py-3">⚫ Off Duty</SelectItem>
                    <SelectItem value="unavailable" className="rounded-lg text-base py-3">🔴 Unavailable</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>


            <div className="flex flex-col space-y-3 pt-6">
              <Button
                type="submit"
                disabled={isSubmitting || !formData.name.trim() || !formData.role.trim()}
                className="w-full h-14 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-base"
                data-testid="button-submit-add-member"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                    Adding Member...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Add to Team
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
                className="w-full h-12 border-2 border-gray-300 hover:border-gray-400 rounded-xl font-medium text-base"
                data-testid="button-cancel-add-member"
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}