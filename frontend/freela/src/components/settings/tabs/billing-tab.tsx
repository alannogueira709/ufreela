"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  CreditCard,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Building2,
  Loader2,
  ExternalLink,
  Plus,
} from "lucide-react";
import { billingApi, type StripeAccountData, type TransactionItem } from "@/lib/settings-api";

interface Props {
  role: "freelancer" | "publisher";
}

export function BillingTab({ role }: Props) {
  const [account, setAccount] = useState<StripeAccountData | null>(null);
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [accRes, txRes] = await Promise.all([
        billingApi.getAccount().catch(() => null),
        billingApi.getTransactions(role).catch(() => []),
      ]);
      setAccount(accRes);
      setTransactions(txRes);
    } catch {
      toast.error("Erro ao carregar dados financeiros");
    } finally {
      setLoading(false);
    }
  }, [role]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateAccount = async () => {
    setCreating(true);
    try {
      const data = await billingApi.createAccount();
      if (data.onboarding_url) {
        window.location.href = data.onboarding_url;
      }
    } catch {
      toast.error("Erro ao criar conta Stripe");
      setCreating(false);
    }
  };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      pending: "bg-amber-100 text-amber-700",
      processing: "bg-blue-100 text-blue-700",
      completed: "bg-emerald-100 text-emerald-700",
      failed: "bg-red-100 text-red-700",
      refunded: "bg-slate-100 text-slate-700",
    };
    return map[status] || "bg-slate-100 text-slate-700";
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-32 bg-slate-100 animate-pulse rounded-lg" />
        <div className="h-64 bg-slate-100 animate-pulse rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="bg-gradient-to-br from-blue-600 to-blue-700 text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">
                  {role === "freelancer" ? "Saldo Disponível" : "Total Gasto"}
                </p>
                <p className="text-3xl font-bold mt-1">R$ 0,00</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center">
                <Wallet className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">Status da Conta Stripe</p>
                {account ? (
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center gap-2">
                      {account.charges_enabled ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <AlertCircle className="h-4 w-4 text-amber-500" />}
                      <span className="text-sm">Recebimentos {account.charges_enabled ? "ativos" : "pendentes"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {account.payouts_enabled ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <AlertCircle className="h-4 w-4 text-amber-500" />}
                      <span className="text-sm">Saques {account.payouts_enabled ? "ativos" : "pendentes"}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground mt-1">Conta não configurada</p>
                )}
              </div>
              <div className="h-12 w-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <Building2 className="h-6 w-6 text-slate-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {!account && role === "freelancer" && (
        <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-amber-900 dark:text-amber-400">Configurar Recebimentos</h4>
                <p className="text-sm text-amber-800 dark:text-amber-500 mt-1">
                  Para receber pagamentos de publishers, configure sua conta Stripe Connect.
                </p>
                <Button onClick={handleCreateAccount} disabled={creating} className="mt-3 bg-amber-600 hover:bg-amber-700">
                  {creating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                  Configurar Conta Stripe
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {account?.onboarding_url && (
        <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ExternalLink className="h-5 w-5 text-blue-600" />
                <div>
                  <h4 className="font-semibold text-sm">Onboarding Pendente</h4>
                  <p className="text-xs text-muted-foreground">Complete seu cadastro na Stripe</p>
                </div>
              </div>
              <Button size="sm" onClick={() => window.location.href = account.onboarding_url!}>
                Completar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Histórico de Transações
          </CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nenhuma transação encontrada</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      {tx.type === "payment" ? (
                        <ArrowUpRight className="h-4 w-4 text-red-500" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4 text-emerald-500" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{tx.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(tx.created_at).toLocaleDateString("pt-BR")}
                        {tx.freelancer_name && ` • ${tx.freelancer_name}`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-semibold ${tx.type === "deposit" ? "text-emerald-600" : "text-slate-900"}`}>
                      {tx.type === "payment" ? "-" : "+"}R$ {tx.amount}
                    </p>
                    <Badge variant="outline" className={`text-[10px] mt-1 ${statusBadge(tx.status)}`}>
                      {tx.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {role === "publisher" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Métodos de Pagamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg border bg-slate-50/50 dark:bg-slate-900/50">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                    <CreditCard className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">•••• 4242</p>
                    <p className="text-xs text-muted-foreground">Visa • Expira 12/26</p>
                  </div>
                </div>
                <Badge>Principal</Badge>
              </div>
              <Button variant="outline" className="w-full">
                <Plus className="h-4 w-4 mr-2" /> Adicionar método
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
