"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  CheckCircle2,
  CircleDollarSign,
  ClipboardCheck,
  Clock3,
  KanbanSquare,
  Loader2,
  LockKeyhole,
  PartyPopper,
} from "lucide-react";
import { toast } from "sonner";

import Footer from "@/components/shared/Footer";
import Navbar from "@/components/shared/Navbar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { getApiErrorMessage } from "@/lib/api-errors";
import {
  approveContractCompletion,
  getDashboardContracts,
  type DashboardContract,
} from "@/lib/contract-service";
import type { UserRole } from "@/types/nav";

type DashboardRole = "freelancer" | "publisher";
type BoardColumn = "active" | "review" | "escrow" | "done";

const columns: Array<{ id: BoardColumn; title: string; description: string }> = [
  {
    id: "active",
    title: "Em andamento",
    description: "Contrato ativo, execução em curso.",
  },
  {
    id: "review",
    title: "Revisão",
    description: "Uma das partes já aprovou a entrega.",
  },
  {
    id: "escrow",
    title: "Escrow",
    description: "Ambas as partes aprovaram; pagamento em liberação.",
  },
  {
    id: "done",
    title: "Finalizado",
    description: "Projeto encerrado e pronto para histórico.",
  },
];

function mapRole(role: UserRole | undefined) {
  return role && ["guest", "freelancer", "publisher", "admin"].includes(role)
    ? role
    : "guest";
}

function formatCurrency(value: string | number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function getColumn(contract: DashboardContract): BoardColumn {
  if (contract.status === "completed" && contract.escrow_released_at) return "done";
  if (contract.status === "completed") return "escrow";
  if (contract.freelancer_completion_approved || contract.publisher_completion_approved) {
    return "review";
  }
  return "active";
}

function approvalLabel(contract: DashboardContract) {
  if (contract.status === "completed") {
    return "Finalizado por ambas as partes";
  }

  const approvals = [
    contract.freelancer_completion_approved ? "freelancer" : null,
    contract.publisher_completion_approved ? "publisher" : null,
  ].filter(Boolean);

  return approvals.length ? `Aprovado por ${approvals.join(" e ")}` : "Aguardando entrega";
}

interface Props {
  role: DashboardRole;
}

export function ProjectDashboardPage({ role }: Props) {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const routeUserId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const { user, isLoading: authLoading } = useAuth();
  const [contracts, setContracts] = useState<DashboardContract[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push("/login");
      return;
    }

    if (user.role !== role || (routeUserId && user.id !== routeUserId)) {
      router.push("/");
      return;
    }

    const load = async () => {
      try {
        setIsLoading(true);
        setError("");
        setContracts(await getDashboardContracts());
      } catch (loadError) {
        setError(getApiErrorMessage(loadError, "Nao foi possivel carregar o dashboard."));
        setContracts([]);
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, [authLoading, role, routeUserId, router, user]);

  const grouped = useMemo(() => {
    return columns.reduce<Record<BoardColumn, DashboardContract[]>>(
      (acc, column) => {
        acc[column.id] = contracts.filter((contract) => getColumn(contract) === column.id);
        return acc;
      },
      { active: [], review: [], escrow: [], done: [] },
    );
  }, [contracts]);

  const activeRole = mapRole(user?.role);
  const activeContracts = contracts.filter((contract) => contract.status === "active");
  const totalValue = contracts.reduce((sum, contract) => sum + Number(contract.total_value), 0);

  const handleComplete = async (contractId: string) => {
    try {
      setUpdatingId(contractId);
      const updated = await approveContractCompletion(contractId);
      setContracts((current) =>
        current.map((contract) => (contract.contract_id === updated.contract_id ? updated : contract)),
      );
      toast.success(
        updated.status === "completed"
          ? "Projeto finalizado. Escrow marcado para liberacao."
          : "Sua aprovacao foi registrada.",
      );
    } catch (completeError) {
      toast.error(getApiErrorMessage(completeError, "Nao foi possivel finalizar o projeto."));
    } finally {
      setUpdatingId(null);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-50">
        <Navbar role={activeRole} />
        <main className="flex flex-1 items-center justify-center">
          <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
            Carregando dashboard...
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-950">
      <Navbar role={activeRole} />
      <main className="flex-1">
        <section className="mx-auto flex max-w-7xl flex-col gap-7 px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-blue-600">
                <KanbanSquare className="h-4 w-4" />
                Dashboard de projetos
              </p>
              <h1 className="mt-3 font-heading text-4xl font-bold tracking-tight md:text-5xl">
                Pipeline de contratos em andamento
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500 md:text-base">
                Acompanhe entregas, revisões, aceite final e liberação de pagamento por escrow.
              </p>
            </div>
            <Link href={role === "freelancer" ? "/jobs" : "/jobs/post"}>
              <Button className="h-11 rounded-full bg-blue-600 px-5 text-white hover:bg-blue-700">
                {role === "freelancer" ? "Buscar novos projetos" : "Publicar novo projeto"}
              </Button>
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-[28px] bg-white p-5 shadow-[0_24px_70px_-44px_rgba(15,23,42,0.35)]">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                <ClipboardCheck className="h-4 w-4" />
                Contratos
              </p>
              <p className="mt-2 text-3xl font-bold">{contracts.length}</p>
            </div>
            <div className="rounded-[28px] bg-slate-950 p-5 text-white shadow-[0_24px_70px_-44px_rgba(15,23,42,0.55)]">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-blue-200">
                <Clock3 className="h-4 w-4" />
                Ativos
              </p>
              <p className="mt-2 text-3xl font-bold">{activeContracts.length}</p>
            </div>
            <div className="rounded-[28px] bg-white p-5 shadow-[0_24px_70px_-44px_rgba(15,23,42,0.35)]">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                <CircleDollarSign className="h-4 w-4" />
                Valor contratado
              </p>
              <p className="mt-2 text-3xl font-bold">{formatCurrency(totalValue)}</p>
            </div>
          </div>

          {error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {contracts.length === 0 ? (
            <div className="rounded-[30px] border border-dashed border-slate-300 bg-white px-6 py-14 text-center shadow-sm">
              <KanbanSquare className="mx-auto h-11 w-11 text-slate-300" />
              <h2 className="mt-4 text-2xl font-bold">Nenhum contrato ativo ainda</h2>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-500">
                Quando uma proposta for aceita, o contrato aparecerá aqui automaticamente.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 xl:grid-cols-4">
              {columns.map((column) => (
                <section key={column.id} className="min-h-[420px] rounded-[28px] bg-white p-4 shadow-sm">
                  <div className="mb-4">
                    <div className="flex items-center justify-between">
                      <h2 className="font-semibold">{column.title}</h2>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
                        {grouped[column.id].length}
                      </span>
                    </div>
                    <p className="mt-1 text-xs leading-5 text-slate-400">{column.description}</p>
                  </div>

                  <div className="space-y-3">
                    {grouped[column.id].map((contract) => {
                      const currentUserApproved =
                        role === "freelancer"
                          ? contract.freelancer_completion_approved
                          : contract.publisher_completion_approved;
                      const canApprove = contract.status === "active" && !currentUserApproved;

                      return (
                        <article key={contract.contract_id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h3 className="font-semibold leading-6">{contract.opportunity_title}</h3>
                              <p className="mt-1 text-xs text-slate-500">
                                {role === "freelancer" ? contract.publisher_name || "Publisher" : contract.freelancer_name}
                              </p>
                            </div>
                            {contract.status === "completed" ? (
                              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                            ) : (
                              <LockKeyhole className="h-5 w-5 text-blue-500" />
                            )}
                          </div>

                          <div className="mt-4 rounded-xl bg-white p-3 text-xs text-slate-500">
                            <p className="font-semibold text-slate-700">{formatCurrency(contract.total_value)}</p>
                            <p className="mt-1">{approvalLabel(contract)}</p>
                          </div>

                          <div className="mt-4 flex flex-wrap gap-2">
                            <Link href={`/proposals/${contract.proposal_id}`}>
                              <Button variant="outline" size="sm" className="rounded-full">
                                Ver proposta
                              </Button>
                            </Link>
                            {canApprove ? (
                              <Button
                                size="sm"
                                disabled={updatingId === contract.contract_id}
                                onClick={() => handleComplete(contract.contract_id)}
                                className="rounded-full bg-emerald-600 text-white hover:bg-emerald-700"
                              >
                                {updatingId === contract.contract_id ? (
                                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <PartyPopper className="mr-1.5 h-3.5 w-3.5" />
                                )}
                                Aprovar entrega
                              </Button>
                            ) : null}
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
