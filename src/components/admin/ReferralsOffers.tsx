import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Gift, Percent, Save, Plus, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export default function ReferralsOffers() {
  const { user } = useAuth();
  const [inviterReward, setInviterReward] = useState('100');
  const [inviteeReward, setInviteeReward] = useState('50');
  const [referrals, setReferrals] = useState<any[]>([]);
  const [promoCodes, setPromoCodes] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  // New promo form
  const [newCode, setNewCode] = useState('');
  const [newPercent, setNewPercent] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newMaxUses, setNewMaxUses] = useState('500');
  const [newExpiry, setNewExpiry] = useState('');

  useEffect(() => {
    loadSettings();
    loadReferrals();
    loadPromos();
  }, []);

  const loadSettings = async () => {
    const { data } = await supabase.from('platform_settings').select('key, value').in('key', ['referral_inviter_reward', 'referral_invitee_reward']);
    data?.forEach(s => {
      if (s.key === 'referral_inviter_reward') setInviterReward(s.value);
      if (s.key === 'referral_invitee_reward') setInviteeReward(s.value);
    });
  };

  const loadReferrals = async () => {
    const { data } = await supabase.from('referrals').select('*').order('created_at', { ascending: false }).limit(20);
    if (data) setReferrals(data);
  };

  const loadPromos = async () => {
    const { data } = await supabase.from('promo_codes').select('*').order('created_at', { ascending: false });
    if (data) setPromoCodes(data);
  };

  const saveRewards = async () => {
    if (!user) return;
    setSaving(true);
    const upsert = async (key: string, value: string) => {
      await supabase.from('platform_settings').upsert({ key, value, updated_by: user.id }, { onConflict: 'key' });
    };
    await Promise.all([upsert('referral_inviter_reward', inviterReward), upsert('referral_invitee_reward', inviteeReward)]);
    setSaving(false);
    toast.success('Referral rewards updated');
  };

  const createPromo = async () => {
    if (!user || !newCode) return;
    const { error } = await supabase.from('promo_codes').insert({
      code: newCode.toUpperCase(),
      discount_percent: Number(newPercent) || 0,
      discount_amount: Number(newAmount) || 0,
      max_uses: Number(newMaxUses) || 500,
      expires_at: newExpiry || null,
      created_by: user.id,
    });
    if (error) { toast.error(error.message); return; }
    toast.success(`Promo "${newCode.toUpperCase()}" created`);
    setNewCode(''); setNewPercent(''); setNewAmount(''); setNewMaxUses('500'); setNewExpiry('');
    loadPromos();
  };

  const togglePromo = async (id: string, active: boolean) => {
    await supabase.from('promo_codes').update({ is_active: !active }).eq('id', id);
    loadPromos();
  };

  return (
    <div className="space-y-6">
      {/* Referral Reward Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Gift className="w-5 h-5 text-primary" /> Referral Rewards
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Inviter Reward (KES)</Label>
              <Input type="number" value={inviterReward} onChange={e => setInviterReward(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">New User Reward (KES)</Label>
              <Input type="number" value={inviteeReward} onChange={e => setInviteeReward(e.target.value)} />
            </div>
          </div>
          <Button onClick={saveRewards} disabled={saving} size="sm">
            <Save className="w-4 h-4 mr-1" /> {saving ? 'Saving…' : 'Save Rewards'}
          </Button>
        </CardContent>
      </Card>

      {/* Recent Referrals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="w-5 h-5 text-primary" /> Recent Referrals
          </CardTitle>
        </CardHeader>
        <CardContent>
          {referrals.length === 0 ? (
            <p className="text-sm text-muted-foreground">No referrals yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Bonus</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {referrals.map(r => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-xs">{r.referral_code}</TableCell>
                    <TableCell>
                      <Badge variant={r.status === 'completed' ? 'default' : 'secondary'} className="text-[10px]">
                        {r.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{r.bonus_paid ? '✅ Paid' : '⏳ Pending'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Promo Code Creator */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Percent className="w-5 h-5 text-primary" /> Create Promo Code
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Code</Label>
              <Input placeholder="KISII2026" value={newCode} onChange={e => setNewCode(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Discount %</Label>
              <Input type="number" placeholder="20" value={newPercent} onChange={e => setNewPercent(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Fixed Discount (KES)</Label>
              <Input type="number" placeholder="0" value={newAmount} onChange={e => setNewAmount(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Max Uses</Label>
              <Input type="number" value={newMaxUses} onChange={e => setNewMaxUses(e.target.value)} />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs">Expires At</Label>
              <Input type="datetime-local" value={newExpiry} onChange={e => setNewExpiry(e.target.value)} />
            </div>
          </div>
          <Button onClick={createPromo} size="sm" disabled={!newCode}>
            <Plus className="w-4 h-4 mr-1" /> Create Promo
          </Button>
        </CardContent>
      </Card>

      {/* Active Promos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Active Promo Codes</CardTitle>
        </CardHeader>
        <CardContent>
          {promoCodes.length === 0 ? (
            <p className="text-sm text-muted-foreground">No promo codes yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Uses</TableHead>
                  <TableHead>Active</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {promoCodes.map(p => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-xs">{p.code}</TableCell>
                    <TableCell className="text-xs">
                      {p.discount_percent > 0 ? `${p.discount_percent}%` : `KES ${p.discount_amount}`}
                    </TableCell>
                    <TableCell className="text-xs">{p.current_uses}/{p.max_uses}</TableCell>
                    <TableCell>
                      <Switch checked={p.is_active} onCheckedChange={() => togglePromo(p.id, p.is_active)} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
