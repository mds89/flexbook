import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Alert, AlertDescription } from './ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { toast } from 'sonner@2.0.3';
import { 
  CreditCard, 
  Building, 
  Save, 
  Info,
  DollarSign,
  Check,
  AlertCircle,
  Settings
} from 'lucide-react';
import { api } from '../services/api';

interface PaymentDetails {
  id: number;
  bank_name: string;
  account_name: string;
  account_number: string;
  sort_code: string;
  reference_instructions: string;
  additional_info: string;
  created_at: string;
  updated_at: string;
}

export const PaymentManagementModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const [formData, setFormData] = useState({
    bank_name: '',
    account_name: '',
    account_number: '',
    sort_code: '',
    reference_instructions: '',
    additional_info: ''
  });

  useEffect(() => {
    if (isOpen) {
      loadPaymentDetails();
    }
  }, [isOpen]);

  const loadPaymentDetails = async () => {
    try {
      setIsLoading(true);
      const response = await api.getPaymentDetails();
      setPaymentDetails(response.paymentDetails);
      setFormData({
        bank_name: response.paymentDetails.bank_name || '',
        account_name: response.paymentDetails.account_name || '',
        account_number: response.paymentDetails.account_number || '',
        sort_code: response.paymentDetails.sort_code || '',
        reference_instructions: response.paymentDetails.reference_instructions || '',
        additional_info: response.paymentDetails.additional_info || ''
      });
      setHasChanges(false);
    } catch (error) {
      console.error('Failed to load payment details:', error);
      toast.error('Failed to load payment details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await api.updatePaymentDetails(formData);
      await loadPaymentDetails();
      setHasChanges(false);
      toast.success('Payment details updated successfully');
    } catch (error) {
      console.error('Failed to update payment details:', error);
      toast.error('Failed to update payment details');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (paymentDetails) {
      setFormData({
        bank_name: paymentDetails.bank_name || '',
        account_name: paymentDetails.account_name || '',
        account_number: paymentDetails.account_number || '',
        sort_code: paymentDetails.sort_code || '',
        reference_instructions: paymentDetails.reference_instructions || '',
        additional_info: paymentDetails.additional_info || ''
      });
      setHasChanges(false);
    }
  };

  const handleClose = () => {
    if (hasChanges) {
      if (window.confirm('You have unsaved changes. Are you sure you want to close?')) {
        setIsOpen(false);
        setHasChanges(false);
      }
    } else {
      setIsOpen(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Settings className="h-4 w-4" />
          Payment Settings
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Management
          </DialogTitle>
          <DialogDescription>
            Configure bank account details and payment instructions that members will see
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Current Payment Information Preview */}
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-800">
                  <Info className="h-5 w-5" />
                  Member View Preview
                </CardTitle>
                <CardDescription className="text-blue-700">
                  This is how payment information appears to members when they need to top up concessions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-6">
                  {/* Bank Transfer Preview */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Building className="h-5 w-5 text-blue-600" />
                      <h4 className="font-medium text-blue-800">Bank Transfer</h4>
                    </div>
                    <div className="bg-white p-4 rounded-lg border space-y-2">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="font-medium">Bank:</span>
                          <div>{formData.bank_name || 'Not set'}</div>
                        </div>
                        <div>
                          <span className="font-medium">Account:</span>
                          <div>{formData.account_name || 'Not set'}</div>
                        </div>
                        <div>
                          <span className="font-medium">Account Number:</span>
                          <div>{formData.account_number || 'Not set'}</div>
                        </div>
                      </div>
                      <div className="text-sm border-t pt-2">
                        <span className="font-medium">Reference:</span>
                        <div className="text-muted-foreground">
                          {formData.reference_instructions || 'Not set'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Additional Info Preview */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-green-600" />
                      <h4 className="font-medium text-green-800">Additional Information</h4>
                    </div>
                    <div className="bg-white p-4 rounded-lg border">
                      <p className="text-sm">
                        {formData.additional_info || 'No additional information provided'}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Edit Payment Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Bank Account Details
                </CardTitle>
                <CardDescription>
                  Configure the bank account information that members will use for payments
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="bank_name">Bank Name</Label>
                    <Input
                      id="bank_name"
                      value={formData.bank_name}
                      onChange={(e) => handleInputChange('bank_name', e.target.value)}
                      placeholder="e.g., ANZ New Zealand"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="account_name">Account Name</Label>
                    <Input
                      id="account_name"
                      value={formData.account_name}
                      onChange={(e) => handleInputChange('account_name', e.target.value)}
                      placeholder="e.g., FlexGym Ltd"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="account_number">Account Number</Label>
                    <Input
                      id="account_number"
                      value={formData.account_number}
                      onChange={(e) => handleInputChange('account_number', e.target.value)}
                      placeholder="e.g., 01-0123-0123456-00"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sort_code">Sort Code (Optional)</Label>
                    <Input
                      id="sort_code"
                      value={formData.sort_code}
                      onChange={(e) => handleInputChange('sort_code', e.target.value)}
                      placeholder="Only needed for some banks"
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reference_instructions">Payment Reference Instructions</Label>
                    <Textarea
                      id="reference_instructions"
                      value={formData.reference_instructions}
                      onChange={(e) => handleInputChange('reference_instructions', e.target.value)}
                      placeholder="Tell members what to use as their payment reference (e.g., 'Please use your full name and email address')"
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="additional_info">Additional Information</Label>
                    <Textarea
                      id="additional_info"
                      value={formData.additional_info}
                      onChange={(e) => handleInputChange('additional_info', e.target.value)}
                      placeholder="Any additional payment information, processing times, or instructions for members"
                      rows={4}
                    />
                  </div>
                </div>

                {hasChanges && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      You have unsaved changes. Click "Save Changes" to update the payment information that members will see.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-4">
                  <Button 
                    onClick={handleSave} 
                    disabled={!hasChanges || isSaving}
                    className="flex items-center gap-2"
                  >
                    {isSaving ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    onClick={handleReset}
                    disabled={!hasChanges || isSaving}
                  >
                    Reset
                  </Button>

                  <Button 
                    variant="outline" 
                    onClick={handleClose}
                    className="ml-auto"
                  >
                    Close
                  </Button>
                </div>
              </CardContent>
            </Card>




          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};