import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  BadgeCheck,
  Clock3,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  Search,
  ShoppingBag,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import axiosInstance from "../../api/axiosInstance";

const numberFormat = new Intl.NumberFormat("fr-TN", { maximumFractionDigits: 0 });
const currencyFormat = new Intl.NumberFormat("fr-TN", {
  style: "currency",
  currency: "TND",
  maximumFractionDigits: 3,
});

const formatDate = (value, includeTime = false) => {
  if (!value) return "Date inconnue";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date inconnue";
  return date.toLocaleString("fr-FR", includeTime
    ? { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }
    : { day: "2-digit", month: "short", year: "numeric" });
};

const statusLabels = {
  pending: "En attente",
  confirmed: "Confirmée",
  paid: "Payée",
  cancelled: "Annulée",
};

const statusClasses = {
  pending: "bg-[#f8f1df] text-[#987324]",
  confirmed: "bg-[#eaf0f7] text-[#456482]",
  paid: "bg-[#edf4ef] text-[#39776d]",
  cancelled: "bg-[#fff0ed] text-[#ae5d4c]",
};

const normalize = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

function LoyaltyToggle({ customer, disabled, onToggle }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={Boolean(customer.isLoyal)}
      aria-label={`${customer.isLoyal ? "Retirer le statut fidèle de" : "Marquer comme fidèle"} ${customer.name}`}
      disabled={disabled}
      onClick={() => onToggle(customer)}
      className="inline-flex items-center gap-2 rounded text-left text-xs font-medium text-[#59655d] disabled:cursor-wait disabled:opacity-50"
    >
      <span className={`relative flex h-5 w-9 shrink-0 items-center rounded-full transition ${customer.isLoyal ? "bg-[#39776d]" : "bg-[#c5cbc6]"}`}>
        <span className={`h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${customer.isLoyal ? "translate-x-4" : "translate-x-0.5"}`} />
      </span>
      <span>{customer.isLoyal ? "Fidèle" : "Standard"}</span>
    </button>
  );
}

function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [loyaltySavingId, setLoyaltySavingId] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let isCurrent = true;

    const fetchOrders = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await axiosInstance.get("/customers/");
        if (isCurrent) setCustomers(Array.isArray(response.data) ? response.data : []);
      } catch (fetchError) {
        if (isCurrent) setError("Impossible de charger les clients. Réessayez.");
      } finally {
        if (isCurrent) setLoading(false);
      }
    };

    fetchOrders();
    return () => {
      isCurrent = false;
    };
  }, [refreshKey]);

  const handleLoyaltyToggle = async (customer) => {
    if (!customer.email) {
      setError("Ce client n'a pas d'adresse e-mail pour enregistrer son statut.");
      return;
    }

    const nextStatus = !customer.isLoyal;
    setLoyaltySavingId(customer.id);
    setError("");

    try {
      const response = await axiosInstance.patch(
        `/customers/${encodeURIComponent(customer.email)}/loyalty`,
        { isLoyal: nextStatus },
      );
      const isLoyal = Boolean(response.data.isLoyal);
      setCustomers((current) => current.map((item) =>
        item.id === customer.id ? { ...item, isLoyal } : item,
      ));
      setSelectedCustomer((current) =>
        current?.id === customer.id ? { ...current, isLoyal } : current,
      );
    } catch (updateError) {
      setError(updateError.response?.data?.message || "Impossible de mettre à jour le statut fidélité.");
    } finally {
      setLoyaltySavingId(null);
    }
  };

  const filteredCustomers = useMemo(() => {
    const normalizedQuery = normalize(query.trim());
    return customers.filter((customer) => {
      const matchesQuery = !normalizedQuery || normalize([
        customer.name,
        customer.email,
        customer.phone,
        customer.address,
      ].join(" ")).includes(normalizedQuery);
      const matchesFilter =
        filter === "all" ||
        (filter === "loyal" && customer.isLoyal) ||
        (filter === "pending" && customer.pendingCount > 0);
      return matchesQuery && matchesFilter;
    });
  }, [customers, filter, query]);

  const loyalCount = customers.filter((customer) => customer.isLoyal).length;
  const pendingCustomerCount = customers.filter((customer) => customer.pendingCount > 0).length;
  const confirmedRevenue = customers.reduce((total, customer) => total + customer.spent, 0);

  const metrics = [
    { label: "Clients", value: numberFormat.format(customers.length), note: "Adresses distinctes", Icon: UsersRound, tint: "bg-[#eef0f6] text-[#5a688d]" },
    { label: "Clients fidèles", value: numberFormat.format(loyalCount), note: "Statut défini par l’admin", Icon: BadgeCheck, tint: "bg-[#edf4ef] text-[#39776d]" },
    { label: "Achats confirmés", value: currencyFormat.format(confirmedRevenue), note: "Commandes confirmées et payées", Icon: ShoppingBag, tint: "bg-[#f6ede8] text-[#965b40]" },
    { label: "À suivre", value: numberFormat.format(pendingCustomerCount), note: "Avec une commande en attente", Icon: Clock3, tint: "bg-[#f8f1df] text-[#a17725]" },
  ];

  return (
    <main className="min-h-screen bg-[#f5f6f3] px-4 py-6 text-[#202923] sm:px-6 lg:px-10 lg:py-9">
      <div className="mx-auto max-w-[1500px]">
        <header className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#8c958f]">
              <UsersRound size={15} />
              Romaterra · Répertoire
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-[#202923] sm:text-3xl">Gestion des clients</h1>
            <p className="mt-1 text-sm text-[#77817a]">Profils et historique d'achat issus des commandes.</p>
          </div>
          <button
            type="button"
            onClick={() => setRefreshKey((key) => key + 1)}
            disabled={loading}
            className="inline-flex h-10 items-center justify-center gap-2 self-start rounded-md border border-[#dfe4df] bg-white px-3.5 text-sm font-medium text-[#47534b] shadow-sm transition hover:border-[#b9c4bc] disabled:cursor-wait disabled:opacity-60 sm:self-auto"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            Actualiser
          </button>
        </header>

        {error && (
          <div role="alert" className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-md border border-[#e9c8bc] bg-[#fff7f3] px-4 py-3 text-sm text-[#8a4934]">
            <span>{error}</span>
            <button type="button" onClick={() => setRefreshKey((key) => key + 1)} className="font-semibold underline underline-offset-4">Réessayer</button>
          </div>
        )}

        <section aria-label="Indicateurs clients" className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map(({ label, value, note, Icon, tint }) => (
            <article key={label} className="rounded-md border border-[#e4e8e3] bg-white p-4 shadow-sm sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-[#77817a]">{label}</p>
                  <p className="mt-2 text-2xl font-semibold tracking-tight text-[#202923] sm:text-[28px]">
                    {loading ? <span className="inline-block h-8 w-24 animate-pulse rounded bg-[#edf0ec] align-middle" /> : value}
                  </p>
                </div>
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md ${tint}`}><Icon size={19} /></span>
              </div>
              <p className="mt-3 text-xs text-[#89928b]">{note}</p>
            </article>
          ))}
        </section>

        <section className="overflow-hidden rounded-md border border-[#e4e8e3] bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-[#edf0ec] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div>
              <h2 className="text-base font-semibold text-[#29352e]">Répertoire clients</h2>
              <p className="mt-1 text-xs text-[#89928b]">
                {loading ? "Chargement…" : `${numberFormat.format(filteredCustomers.length)} résultat${filteredCustomers.length === 1 ? "" : "s"}`}
              </p>
            </div>
            <label className="relative block w-full sm:max-w-sm">
              <span className="sr-only">Rechercher un client</span>
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#89928b]" />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Nom, e-mail, téléphone, adresse…"
                className="h-10 w-full rounded-md border border-[#e1e5e1] bg-[#fbfcfa] pl-9 pr-3 text-sm text-[#465149] outline-none transition placeholder:text-[#a0a8a2] focus:border-[#9d5b3f] focus:bg-white focus:ring-2 focus:ring-[#9d5b3f]/10"
              />
            </label>
          </div>

          <div className="flex flex-wrap gap-2 border-b border-[#edf0ec] px-4 py-3 sm:px-5">
            {[
              { id: "all", label: "Tous les clients", count: customers.length },
              { id: "loyal", label: "Fidèles", count: loyalCount },
              { id: "pending", label: "Commande en attente", count: pendingCustomerCount },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setFilter(item.id)}
                className={`inline-flex items-center gap-2 rounded px-3 py-1.5 text-xs font-medium transition ${filter === item.id ? "bg-[#25352d] text-white" : "bg-[#f3f5f2] text-[#68736b] hover:bg-[#e9ede9]"}`}
              >
                {item.label}
                <span className={filter === item.id ? "text-white/70" : "text-[#929a94]"}>{numberFormat.format(item.count)}</span>
              </button>
            ))}
          </div>

          {loading ? (
            <div className="space-y-2 p-4 sm:p-5">
              {[0, 1, 2, 3].map((item) => <div key={item} className="h-14 animate-pulse rounded bg-[#f5f6f3]" />)}
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="flex flex-col items-center px-4 py-16 text-center">
              <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-md bg-[#eef0f6] text-[#5a688d]"><UserRound size={20} /></span>
              <p className="text-sm font-medium text-[#566158]">{customers.length ? "Aucun client ne correspond" : "Aucun client pour le moment"}</p>
              <p className="mt-1 text-xs text-[#929a94]">{customers.length ? "Modifiez votre recherche ou votre filtre." : "Les clients apparaîtront après leurs premières commandes."}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-left">
                <thead>
                  <tr className="bg-[#f8f9f7] text-[11px] font-semibold uppercase tracking-wide text-[#89928b]">
                    <th className="px-5 py-3">Client</th>
                    <th className="px-5 py-3">Contact</th>
                    <th className="px-5 py-3 text-center">Commandes</th>
                    <th className="px-5 py-3 text-right">Achats confirmés</th>
                    <th className="px-5 py-3">Fidélité</th>
                    <th className="px-5 py-3">Dernière activité</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#edf0ec]">
                  {filteredCustomers.map((customer) => (
                    <tr key={customer.id} className="transition hover:bg-[#fbfcfa]">
                      <td className="px-5 py-3.5">
                        <button type="button" onClick={() => setSelectedCustomer(customer)} className="text-left">
                          <span className="block text-sm font-semibold text-[#354139] hover:text-[#965b40]">{customer.name}</span>
                          <span className="mt-0.5 block max-w-[240px] truncate text-xs text-[#89928b]">{customer.address || "Adresse non renseignée"}</span>
                        </button>
                      </td>
                      <td className="px-5 py-3.5">
                        {customer.email && <a href={`mailto:${customer.email}`} className="block max-w-[230px] truncate text-xs text-[#59655d] hover:text-[#965b40]">{customer.email}</a>}
                        {customer.phone && <a href={`tel:${customer.phone}`} className="mt-1 block text-xs text-[#89928b] hover:text-[#965b40]">{customer.phone}</a>}
                        {!customer.email && !customer.phone && <span className="text-xs text-[#a0a8a2]">Contact non renseigné</span>}
                      </td>
                      <td className="px-5 py-3.5 text-center text-sm font-medium text-[#465149]">{numberFormat.format(customer.orders.length)}</td>
                      <td className="px-5 py-3.5 text-right text-sm font-semibold text-[#354139]">{currencyFormat.format(customer.spent)}</td>
                      <td className="px-5 py-3.5">
                        <LoyaltyToggle
                          customer={customer}
                          disabled={loyaltySavingId === customer.id}
                          onToggle={handleLoyaltyToggle}
                        />
                      </td>
                      <td className="px-5 py-3.5 text-xs text-[#77817a]">{formatDate(customer.lastOrderAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-[#17201c]/35" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setSelectedCustomer(null);
        }}>
          <aside role="dialog" aria-modal="true" aria-labelledby="customer-detail-title" className="flex h-full w-full max-w-lg flex-col overflow-y-auto bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-[#edf0ec] px-5 py-5 sm:px-7">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#f2eae5] text-[#965b40]"><UserRound size={20} /></span>
                <div>
                  <h2 id="customer-detail-title" className="text-lg font-semibold text-[#29352e]">{selectedCustomer.name}</h2>
                  <p className="mt-0.5 text-xs text-[#89928b]">Client depuis le {formatDate(selectedCustomer.orders[selectedCustomer.orders.length - 1]?.createdAt)}</p>
                </div>
              </div>
              <button type="button" onClick={() => setSelectedCustomer(null)} aria-label="Fermer la fiche client" className="rounded p-2 text-[#89928b] hover:bg-[#f3f5f2] hover:text-[#354139]"><X size={18} /></button>
            </div>

            <div className="space-y-6 px-5 py-5 sm:px-7">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-md bg-[#f6f7f5] p-3.5">
                  <p className="text-xs text-[#89928b]">Commandes</p>
                  <p className="mt-1 text-lg font-semibold text-[#29352e]">{numberFormat.format(selectedCustomer.orders.length)}</p>
                </div>
                <div className="rounded-md bg-[#f6f7f5] p-3.5">
                  <p className="text-xs text-[#89928b]">Achats confirmés</p>
                  <p className="mt-1 truncate text-lg font-semibold text-[#29352e]">{currencyFormat.format(selectedCustomer.spent)}</p>
                </div>
              </div>

              <section className="flex items-center justify-between gap-4 border-y border-[#edf0ec] py-4">
                <div>
                  <h3 className="text-sm font-semibold text-[#354139]">Statut fidélité</h3>
                  <p className="mt-1 text-xs text-[#89928b]">Défini manuellement par l’administration</p>
                </div>
                <LoyaltyToggle
                  customer={selectedCustomer}
                  disabled={loyaltySavingId === selectedCustomer.id}
                  onToggle={handleLoyaltyToggle}
                />
              </section>

              <section>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#89928b]">Coordonnées</h3>
                <div className="space-y-3 text-sm text-[#465149]">
                  {selectedCustomer.email && <a href={`mailto:${selectedCustomer.email}`} className="flex items-center gap-3 hover:text-[#965b40]"><Mail size={16} className="text-[#89928b]" />{selectedCustomer.email}<ArrowUpRight size={13} /></a>}
                  {selectedCustomer.phone && <a href={`tel:${selectedCustomer.phone}`} className="flex items-center gap-3 hover:text-[#965b40]"><Phone size={16} className="text-[#89928b]" />{selectedCustomer.phone}<ArrowUpRight size={13} /></a>}
                  {selectedCustomer.address && <p className="flex items-start gap-3"><MapPin size={16} className="mt-0.5 shrink-0 text-[#89928b]" />{selectedCustomer.address}</p>}
                  {!selectedCustomer.email && !selectedCustomer.phone && !selectedCustomer.address && <p className="text-[#89928b]">Aucune coordonnée disponible.</p>}
                </div>
              </section>

              <section>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-[#89928b]">Historique des commandes</h3>
                  <span className="text-xs text-[#89928b]">{numberFormat.format(selectedCustomer.orders.length)}</span>
                </div>
                <div className="divide-y divide-[#edf0ec] rounded-md border border-[#edf0ec]">
                  {selectedCustomer.orders.map((order) => (
                    <div key={order._id} className="flex items-center justify-between gap-3 px-3.5 py-3">
                      <div className="min-w-0">
                        <p className="font-mono text-xs font-semibold text-[#465149]">#{String(order._id || "").slice(-7).toUpperCase()}</p>
                        <p className="mt-1 text-xs text-[#89928b]">{formatDate(order.createdAt, true)}</p>
                        <p className="mt-1 truncate text-xs text-[#68736b]">{(order.items || []).map((item) => item.product?.name || "Produit").join(", ")}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-semibold text-[#354139]">{currencyFormat.format(Number(order.totalAmount) || 0)}</p>
                        <span className={`mt-1 inline-flex rounded px-1.5 py-0.5 text-[10px] font-semibold ${statusClasses[order.status] || "bg-[#eff1ef] text-[#68736b]"}`}>
                          {statusLabels[order.status] || order.status || "Inconnue"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </aside>
        </div>
      )}
    </main>
  );
}

export default CustomersPage;