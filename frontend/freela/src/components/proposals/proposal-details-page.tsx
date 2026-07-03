"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle, XCircle } from "lucide-react";

import Loading from "@/components/shared/Loading";
import Footer from "@/components/shared/Footer";
import Navbar from "@/components/shared/Navbar";
import { Button } from "@/components/ui/button";
import { getApiErrorMessage } from "@/lib/api-errors";
import { getProposalById, updateProposalStatus } from "@/lib/proposal-service";
import { billingApi } from "@/lib/settings-api";
import { useAuth } from "@/contexts/AuthContext";
import type { Proposal } from "@/types/proposal";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { CheckoutDialog } from "./checkout-dialog";

function formatCurrency(value: string | number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(value));
}

function formatPublished(value: string) {
  const diffMs = Date.now() - new Date(value).getTime();
  const diffHours = Math.max(1, Math.round(diffMs / (1000 * 60 * 60)));

  if (diffHours < 24) {
    return `Enviado há ${diffHours} hora${diffHours > 1 ? "s" : ""}`;
  }

  const diffDays = Math.max(1, Math.round(diffHours / 24));
  return `Enviado há ${diffDays} dia${diffDays > 1 ? "s" : ""}`;
}

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "");

export function ProposalDetailsPage() {
  const params = useParams<{ id: string }>();
  const proposalId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [clientSecret, setClientSecret] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (!proposalId) return;

    const loadProposal = async () => {
      try {
        setIsLoading(true);
        setError("");
        const data = await getProposalById(proposalId);
        setProposal(data);
      } catch (err) {
        setError(getApiErrorMessage(err, "Não foi possível carregar esta proposta."));
      } finally {
        setIsLoading(false);
      }
    };

    void loadProposal();
  }, [proposalId]);

  const handleOpenCheckout = async () => {
    if (!proposalId || !proposal) return;
    
    try {
      setIsUpdating(true);
      setError("");
      setSuccessMessage("");
      const res = await billingApi.createPaymentIntent({
        proposal_id: proposalId,
      });
      setClientSecret(res.client_secret);
      setIsCheckoutOpen(true);
    } catch (err) {
      setError(getApiErrorMessage(err, "Não foi possível iniciar o pagamento."));
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdateStatus = async (status: "accepted" | "rejected") => {
    if (!proposalId) return;
    
    try {
      setIsUpdating(true);
      const updated = await updateProposalStatus(proposalId, status);
      setProposal(updated);
      if (status === "accepted" && user?.id) {
        router.push(`/profile/publisher/${user.id}/dashboard`);
      }
    } catch (err) {
      setError(getApiErrorMessage(err, "Não foi possível atualizar o status da proposta."));
    } finally {
      setIsUpdating(false);
    }
  };

  const refreshProposal = async () => {
    if (!proposalId) return;
    const updated = await getProposalById(proposalId);
    setProposal(updated);
  };

  const isPublisher = user?.role === "publisher";
  const isPending = proposal?.status === "pending";
  const dashboardHref =
    user?.role === "publisher"
      ? `/profile/publisher/${user.id}/dashboard`
      : user?.role === "freelancer"
        ? `/profile/freelancer/${user.id}/dashboard`
        : "/";

  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-[#f5f7fb] text-slate-900">
        <Navbar role={user?.role || "guest"} />
        <main className="flex-1">
          <Loading text="Carregando proposta..." />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#f5f7fb] text-slate-900">
      <Navbar role={user?.role || "guest"} />
      <main className="flex-1">
        <section className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
          <button
            onClick={() => router.back()}
            className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-slate-500 transition-colors hover:text-blue-600"
          >
            <ArrowLeft className="size-4" />
            Voltar
          </button>

          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {successMessage}
            </div>
          )}

          {!proposal && !error ? (
            <div className="rounded-[32px] border border-dashed border-slate-300 bg-white px-6 py-12 text-center shadow-sm">
              <h1 className="font-heading text-2xl font-bold tracking-tight text-slate-950">
                Proposta não encontrada
              </h1>
            </div>
          ) : null}

          {proposal && (
            <div className="space-y-6">
              <div className="rounded-[30px] bg-white p-8 shadow-[0_24px_70px_-40px_rgba(15,23,42,0.24)]">
                <div className="flex items-center justify-between border-b border-slate-100 pb-6">
                  <div>
                    <h1 className="font-heading text-3xl font-bold tracking-tight text-slate-950">
                      Proposta para {proposal.opportunity.title}
                    </h1>
                    <p className="mt-2 text-sm font-medium text-slate-500">
                      De: {proposal.freelancer.name} {proposal.freelancer.last_name} • Nível: {proposal.freelancer.professional_level}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className={`inline-flex rounded-full px-4 py-1.5 text-sm font-semibold uppercase tracking-wide
                      ${proposal.status === "accepted" ? "bg-emerald-100 text-emerald-700" :
                        proposal.status === "rejected" ? "bg-red-100 text-red-700" :
                        "bg-amber-100 text-amber-700"}`}>
                      {proposal.status === "accepted" ? "Aceita" :
                        proposal.status === "rejected" ? "Recusada" : "Pendente"}
                    </div>
                    <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                      {formatPublished(proposal.created_at)}
                    </p>
                  </div>
                </div>

                <div className="py-8">
                  <h3 className="font-heading text-xl font-bold text-slate-950">Carta de Apresentação</h3>
                  <div className="mt-4 whitespace-pre-wrap rounded-2xl bg-slate-50 p-6 text-[15px] leading-8 text-slate-600">
                    {proposal.cover_letter}
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-2xl bg-blue-50/50 p-6">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Valor Proposto
                    </p>
                    <p className="mt-1 font-heading text-3xl font-bold tracking-tight text-slate-950">
                      {formatCurrency(proposal.proposed_value)}
                    </p>
                    {proposal.opportunity.deadline ? (
                      <p className="mt-1 text-sm font-medium text-slate-500">
                        Prazo de entrega:{" "}
                        <span className="font-semibold text-slate-700">
                          {new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).format(
                            new Date(proposal.opportunity.deadline + "T00:00:00")
                          )}
                        </span>
                      </p>
                    ) : null}
                  </div>

                  {isPublisher && isPending && (
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        disabled={isUpdating}
                        onClick={() => handleUpdateStatus("rejected")}
                        className="h-12 rounded-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                      >
                        <XCircle className="mr-2 size-4" />
                        Recusar
                      </Button>
                      <Button
                        disabled={isUpdating}
                        onClick={handleOpenCheckout}
                        className="h-12 rounded-full bg-emerald-600 text-white hover:bg-emerald-700"
                      >
                        <CheckCircle className="mr-2 size-4" />
                        Aceitar e Pagar Contrato
                      </Button>
                    </div>
                  )}
                  {proposal.status === "accepted" && (
                    <Link href={dashboardHref}>
                      <Button className="h-12 rounded-full bg-blue-600 px-6 text-white hover:bg-blue-700">
                        Ir para dashboard do contrato
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )}

          {clientSecret && (
            <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe' } }}>
              <CheckoutDialog
                isOpen={isCheckoutOpen}
                onOpenChange={setIsCheckoutOpen}
                onSuccess={async () => {
                  setIsCheckoutOpen(false);
                  setSuccessMessage(
                    "Pagamento confirmado. O contrato sera ativado em instantes."
                  );
                  await refreshProposal();
                }}
                amountFormatted={formatCurrency(proposal?.proposed_value || 0)}
              />
            </Elements>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
