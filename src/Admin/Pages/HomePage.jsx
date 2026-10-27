import React, { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  BadgePercent,
  CalendarDays,
  CircleDollarSign,
  Package,
  RefreshCw,
  ShoppingBag,
} from "lucide-react";
import { Chart as ChartJS, BarController, BarElement, CategoryScale, Legend, LineController, LineElement, LinearScale, PointElement, Tooltip } from "chart.js";
import { Chart } from "react-chartjs-2";
import axiosInstance from "../../api/axiosInstance";

ChartJS.register(BarController, BarElement, CategoryScale, Legend, LineController, LineElement, LinearScale, PointElement, Tooltip);

const numberFormat = new Intl.NumberFormat("fr-TN", { maximumFractionDigits: 0 });
const currencyFormat = new Intl.NumberFormat("fr-TN", {
  style: "currency",
  currency: "TND",
  maximumFractionDigits: 3,
});

const toDateInputValue = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getDateKey = (value) => {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : toDateInputValue(date);
};

const getInitialRange = () => {
  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - 6);
  return { from: toDateInputValue(start), to: toDateInputValue(end) };
};

const isSaleOrder = (order) => ["confirmed", "paid"].includes(order.status);

const getOrderTotals = (orders) =>
  orders.reduce(
    (totals, order) => {
      (order.items || []).forEach((item) => {
        const quantity = Number(item.quantity) || 0;
        totals.units += quantity;
        totals.revenue += (Number(item.price) || 0) * quantity;
      });
      return totals;
    },
    { units: 0, revenue: 0 },
  );

const getOrderItemInfo = (item, productsById) => {
  const populatedProduct = typeof item.product === "object" ? item.product : null;
  const productId = populatedProduct?._id || item.product;
  const product = productsById.get(String(productId)) || populatedProduct;
  const collection = product?.collection;

  return {
    name: product?.name || "Produit indisponible",
    collectionName: typeof collection === "object" ? collection?.name : "",
  };
};

const orderStatusLabels = {
  pending: "En attente",
  confirmed: "Confirmée",
  paid: "Payée",
  cancelled: "Annulée",
};

const orderStatusStyles = {
  pending: "bg-[#f8f1df] text-[#987324]",
  confirmed: "bg-[#eaf0f7] text-[#456482]",
  paid: "bg-[#edf4ef] text-[#39776d]",
  cancelled: "bg-[#fff0ed] text-[#ae5d4c]",
};

function HomePage() {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [dateRange, setDateRange] = useState(getInitialRange);
  const [activePreset, setActivePreset] = useState("7 jours");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let isCurrent = true;

    const fetchDashboardData = async () => {
      setLoading(true);
      setError("");
      try {
        const [ordersResponse, productsResponse] = await Promise.all([
          axiosInstance.get("/orders/"),
          axiosInstance.get("/products/"),
        ]);
        if (!isCurrent) return;
        setOrders(Array.isArray(ordersResponse.data) ? ordersResponse.data : []);
        setProducts(Array.isArray(productsResponse.data) ? productsResponse.data : []);
      } catch (fetchError) {
        if (isCurrent) setError("Impossible de charger les ventes et le stock. Réessayez.");
      } finally {
        if (isCurrent) setLoading(false);
      }
    };

    fetchDashboardData();
    return () => {
      isCurrent = false;
    };
  }, [refreshKey]);

  const saleOrders = useMemo(() => orders.filter(isSaleOrder), [orders]);
  const periodOrders = useMemo(
    () =>
      saleOrders.filter((order) => {
        const dateKey = getDateKey(order.createdAt);
        return dateKey && dateKey >= dateRange.from && dateKey <= dateRange.to;
      }),
    [saleOrders, dateRange],
  );
  const periodTotals = useMemo(() => getOrderTotals(periodOrders), [periodOrders]);
  const stockRemaining = products.reduce(
    (total, product) => total + (Number(product.quantityInStock) || 0),
    0,
  );
  const promoProducts = products.filter((product) => product.status === "Promo");
  const productsById = useMemo(
    () => new Map(products.map((product) => [String(product._id), product])),
    [products],
  );
  const recentOrders = useMemo(
    () =>
      [...orders]
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
        .slice(0, 8),
    [orders],
  );

  const dailySales = useMemo(() => {
    if (!dateRange.from || !dateRange.to || dateRange.from > dateRange.to) return [];

    const days = [];
    const current = new Date(`${dateRange.from}T00:00:00`);
    const end = new Date(`${dateRange.to}T00:00:00`);
    while (current <= end) {
      const key = toDateInputValue(current);
      days.push({ key, revenue: 0, units: 0 });
      current.setDate(current.getDate() + 1);
    }

    const byDate = new Map(days.map((day) => [day.key, day]));
    periodOrders.forEach((order) => {
      const day = byDate.get(getDateKey(order.createdAt));
      if (!day) return;
      (order.items || []).forEach((item) => {
        const quantity = Number(item.quantity) || 0;
        day.units += quantity;
        day.revenue += (Number(item.price) || 0) * quantity;
      });
    });
    return days;
  }, [dateRange, periodOrders]);

  const chartData = {
    labels: dailySales.map((day) =>
      new Date(`${day.key}T00:00:00`).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "short",
      }),
    ),
    datasets: [
      {
        type: "bar",
        label: "Chiffre d'affaires (TND)",
        data: dailySales.map((day) => day.revenue),
        yAxisID: "y",
        backgroundColor: "rgba(157, 91, 63, 0.78)",
        hoverBackgroundColor: "#9d5b3f",
        borderRadius: 5,
        maxBarThickness: 28,
      },
      {
        type: "line",
        label: "Articles vendus",
        data: dailySales.map((day) => day.units),
        yAxisID: "yUnits",
        borderColor: "#39776d",
        backgroundColor: "#39776d",
        pointBackgroundColor: "#ffffff",
        pointBorderColor: "#39776d",
        pointBorderWidth: 2,
        pointRadius: 3,
        tension: 0.35,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: {
        position: "bottom",
        align: "start",
        labels: { usePointStyle: true, boxWidth: 7, boxHeight: 7, padding: 20, color: "#68716c" },
      },
      tooltip: {
        backgroundColor: "#17201c",
        padding: 12,
        callbacks: {
          label: (context) =>
            context.dataset.yAxisID === "y"
              ? ` ${currencyFormat.format(context.raw)}`
              : ` ${numberFormat.format(context.raw)} article${context.raw > 1 ? "s" : ""}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: { color: "#89918c", maxRotation: 0, autoSkip: true, maxTicksLimit: 10 },
      },
      y: {
        beginAtZero: true,
        grid: { color: "#edf0ec" },
        border: { display: false, dash: [3, 4] },
        ticks: { color: "#89918c", maxTicksLimit: 5, callback: (value) => numberFormat.format(value) },
      },
      yUnits: {
        beginAtZero: true,
        position: "right",
        grid: { drawOnChartArea: false },
        border: { display: false },
        ticks: { color: "#89918c", maxTicksLimit: 5, precision: 0 },
      },
    },
  };

  const updateDateRange = (range) => {
    setDateRange(range);
    setActivePreset("");
  };

  const applyPreset = (days) => {
    const end = new Date();
    const start = new Date(end);
    if (days === "month") start.setDate(1);
    else start.setDate(start.getDate() - days + 1);
    setDateRange({ from: toDateInputValue(start), to: toDateInputValue(end) });
    setActivePreset(days === "month" ? "Ce mois" : `${days} jours`);
  };

  const metrics = [
    {
      label: "Chiffre d'affaires",
      value: currencyFormat.format(periodTotals.revenue),
      detail: `${numberFormat.format(periodOrders.length)} commande${periodOrders.length > 1 ? "s" : ""} confirmée${periodOrders.length > 1 ? "s" : ""}`,
      Icon: CircleDollarSign,
      tint: "bg-[#f6ede8] text-[#965b40]",
    },
    {
      label: "Articles vendus",
      value: numberFormat.format(periodTotals.units),
      detail: "Confirmés et payés sur la période",
      Icon: ShoppingBag,
      tint: "bg-[#eaf2ee] text-[#39776d]",
    },
    {
      label: "Stock disponible",
      value: numberFormat.format(stockRemaining),
      detail: `Unités réparties sur ${numberFormat.format(products.length)} références`,
      Icon: Package,
      tint: "bg-[#eef0f6] text-[#5a688d]",
    },
    {
      label: "Produits en promo",
      value: numberFormat.format(promoProducts.length),
      detail: "Offres actuellement actives",
      Icon: BadgePercent,
      tint: "bg-[#f8f1df] text-[#a17725]",
    },
  ];

  return (
    <main className="min-h-screen bg-[#f5f6f3] px-4 py-6 text-[#202923] sm:px-6 lg:px-10 lg:py-9">
      <div className="mx-auto max-w-[1500px]">
        <header className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#8c958f]">
              <Activity size={15} strokeWidth={2.2} />
              Romaterra · Vue d'ensemble
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-[#202923] sm:text-3xl">
              Activité commerciale
            </h1>
            <p className="mt-1 text-sm text-[#77817a]">
              Suivez vos ventes, votre stock et vos offres en un coup d'œil.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setRefreshKey((key) => key + 1)}
            disabled={loading}
            className="inline-flex h-10 items-center justify-center gap-2 self-start rounded-md border border-[#dfe4df] bg-white px-3.5 text-sm font-medium text-[#47534b] shadow-sm transition hover:border-[#b9c4bc] hover:bg-[#fbfcfa] disabled:cursor-wait disabled:opacity-60 sm:self-auto"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            Actualiser
          </button>
        </header>

        {error && (
          <div role="alert" className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-md border border-[#e9c8bc] bg-[#fff7f3] px-4 py-3 text-sm text-[#8a4934]">
            <span>{error}</span>
            <button type="button" onClick={() => setRefreshKey((key) => key + 1)} className="font-semibold underline underline-offset-4">
              Réessayer
            </button>
          </div>
        )}

        <section aria-label="Filtres de date" className="mb-5 flex flex-col gap-4 rounded-md border border-[#e4e8e3] bg-white px-4 py-3.5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#465149]">
            <CalendarDays size={17} className="text-[#9d5b3f]" />
            Période des ventes
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2">
              <label htmlFor="sales-from" className="sr-only">Du</label>
              <input
                id="sales-from"
                type="date"
                value={dateRange.from}
                max={dateRange.to || undefined}
                onChange={(event) => updateDateRange({ ...dateRange, from: event.target.value })}
                className="h-9 min-w-0 rounded border border-[#e1e5e1] bg-[#fbfcfa] px-2 text-sm text-[#465149] outline-none focus:border-[#9d5b3f] focus:ring-2 focus:ring-[#9d5b3f]/10"
              />
              <span className="text-xs text-[#a0a8a2]">au</span>
              <label htmlFor="sales-to" className="sr-only">Au</label>
              <input
                id="sales-to"
                type="date"
                value={dateRange.to}
                min={dateRange.from || undefined}
                onChange={(event) => updateDateRange({ ...dateRange, to: event.target.value })}
                className="h-9 min-w-0 rounded border border-[#e1e5e1] bg-[#fbfcfa] px-2 text-sm text-[#465149] outline-none focus:border-[#9d5b3f] focus:ring-2 focus:ring-[#9d5b3f]/10"
              />
            </div>
            <div className="flex rounded border border-[#e1e5e1] p-0.5">
              {[{ label: "7 jours", value: 7 }, { label: "30 jours", value: 30 }, { label: "Ce mois", value: "month" }].map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => applyPreset(preset.value)}
                  className={`rounded px-2.5 py-1.5 text-xs font-medium transition ${activePreset === preset.label ? "bg-[#25352d] text-white" : "text-[#68736b] hover:bg-[#f1f3f0] hover:text-[#29372f]"}`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section aria-label="Indicateurs clés" className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map(({ label, value, detail, Icon, tint }) => (
            <article key={label} className="min-w-0 rounded-md border border-[#e4e8e3] bg-white p-4 shadow-sm sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-[#77817a]">{label}</p>
                  <p className="mt-2 truncate text-2xl font-semibold tracking-tight text-[#202923] sm:text-[28px]">
                    {loading ? <span className="inline-block h-8 w-28 animate-pulse rounded bg-[#edf0ec] align-middle" /> : value}
                  </p>
                </div>
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md ${tint}`}>
                  <Icon size={19} strokeWidth={1.9} />
                </span>
              </div>
              <p className="mt-3 truncate text-xs text-[#89928b]">{detail}</p>
            </article>
          ))}
        </section>

        <section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.8fr)_minmax(330px,0.9fr)]">
          <article className="min-w-0 rounded-md border border-[#e4e8e3] bg-white p-4 shadow-sm sm:p-5 lg:p-6">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-[#29352e]">Ventes quotidiennes</h2>
                <p className="mt-1 text-xs text-[#89928b]">Chiffre d'affaires et unités vendues · commandes confirmées et payées</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-[#89928b]">Total sur la période</p>
                <p className="mt-1 text-sm font-semibold text-[#29352e]">{loading ? "—" : currencyFormat.format(periodTotals.revenue)}</p>
              </div>
            </div>
            <div className="relative h-[280px] sm:h-[330px]">
              {!loading && dailySales.length > 0 && <Chart type="bar" data={chartData} options={chartOptions} />}
              {loading && <div className="h-full animate-pulse rounded bg-[#f5f6f3]" />}
              {!loading && dailySales.length === 0 && (
                <div className="flex h-full items-center justify-center rounded bg-[#f8f9f7] text-sm text-[#89928b]">
                  Sélectionnez une période valide pour afficher les ventes.
                </div>
              )}
              {!loading && dailySales.length > 0 && periodTotals.units === 0 && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center pb-8 text-sm text-[#89928b]">
                  Aucune vente confirmée sur cette période.
                </div>
              )}
            </div>
          </article>

          <article className="flex min-w-0 flex-col rounded-md border border-[#e4e8e3] bg-white p-4 shadow-sm sm:p-5 lg:p-6">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-[#29352e]">Produits en promotion</h2>
                <p className="mt-1 text-xs text-[#89928b]">Offres configurées dans le catalogue</p>
              </div>
              <span className="inline-flex h-8 min-w-8 items-center justify-center rounded bg-[#f8f1df] px-2 text-xs font-semibold text-[#987324]">
                {numberFormat.format(promoProducts.length)}
              </span>
            </div>

            {loading ? (
              <div className="space-y-3 py-2">
                {[0, 1, 2].map((item) => <div key={item} className="h-[68px] animate-pulse rounded bg-[#f5f6f3]" />)}
              </div>
            ) : promoProducts.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center py-12 text-center">
                <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-md bg-[#f8f1df] text-[#a17725]">
                  <BadgePercent size={20} />
                </span>
                <p className="text-sm font-medium text-[#566158]">Aucune promotion active</p>
                <p className="mt-1 text-xs text-[#929a94]">Les produits marqués « Promo » apparaîtront ici.</p>
              </div>
            ) : (
              <div className="max-h-[370px] divide-y divide-[#edf0ec] overflow-y-auto pr-1">
                {promoProducts.map((product) => {
                  const image = Array.isArray(product.images) ? product.images[0] : "";
                  const hasPromoPrice = Number(product.promoPrice) > 0 && Number(product.promoPrice) < Number(product.price);
                  const discount = hasPromoPrice ? Math.round((1 - product.promoPrice / product.price) * 100) : null;
                  const stock = Number(product.quantityInStock) || 0;
                  return (
                    <div key={product._id} className="flex items-center gap-3 py-3 first:pt-1 last:pb-1">
                      {image ? (
                        <img src={image} alt="" className="h-12 w-12 shrink-0 rounded object-cover" />
                      ) : (
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded bg-[#f2f4f1] text-[#829087]">
                          <Package size={19} />
                        </span>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-[#354139]">{product.name}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
                          {hasPromoPrice ? (
                            <>
                              <span className="font-semibold text-[#965b40]">{currencyFormat.format(product.promoPrice)}</span>
                              <span className="text-[#a1a9a3] line-through">{currencyFormat.format(product.price)}</span>
                              <span className="rounded bg-[#edf4ef] px-1.5 py-0.5 font-medium text-[#39776d]">-{discount}%</span>
                            </>
                          ) : (
                            <span className="font-semibold text-[#965b40]">{currencyFormat.format(product.price)}</span>
                          )}
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-xs font-medium text-[#59655d]">{numberFormat.format(stock)} en stock</p>
                        <p className={`mt-1 text-[10px] font-semibold uppercase tracking-wide ${stock > 0 ? "text-[#39776d]" : "text-[#b35b49]"}`}>
                          {stock > 0 ? "Disponible" : "Épuisé"}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="mt-auto flex items-center justify-between border-t border-[#edf0ec] pt-4 text-xs text-[#89928b]">
              <span>Stock total disponible</span>
              <span className="font-semibold text-[#465149]">{loading ? "—" : numberFormat.format(stockRemaining)} unités</span>
            </div>
          </article>
        </section>

        <section className="mt-5 rounded-md border border-[#e4e8e3] bg-white p-4 shadow-sm sm:p-5 lg:p-6">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-[#29352e]">Commandes récentes</h2>
              <p className="mt-1 text-xs text-[#89928b]">Produits, collections et état des dernières commandes reçues</p>
            </div>
            <span className="text-xs font-medium text-[#89928b]">
              {loading ? "Chargement…" : `${numberFormat.format(recentOrders.length)} dernière${recentOrders.length > 1 ? "s" : ""}`}
            </span>
          </div>

          {loading ? (
            <div className="space-y-2">
              {[0, 1, 2].map((item) => <div key={item} className="h-16 animate-pulse rounded bg-[#f5f6f3]" />)}
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="rounded bg-[#f8f9f7] px-4 py-10 text-center text-sm text-[#89928b]">
              Aucune commande n'a encore été reçue.
            </div>
          ) : (
            <div className="divide-y divide-[#edf0ec]">
              {recentOrders.map((order) => {
                const items = order.items || [];
                const itemCount = items.reduce((total, item) => total + (Number(item.quantity) || 0), 0);
                const status = order.status || "pending";
                return (
                  <article key={order._id} className="grid grid-cols-1 gap-3 py-4 first:pt-1 last:pb-1 sm:grid-cols-[minmax(105px,0.75fr)_minmax(0,1.8fr)_minmax(88px,0.6fr)_minmax(112px,0.75fr)] sm:items-center sm:gap-5">
                    <div className="flex items-center justify-between gap-3 sm:block">
                      <div>
                        <p className="font-mono text-xs font-semibold text-[#465149]">#{String(order._id || "").slice(-7).toUpperCase()}</p>
                        <p className="mt-1 text-xs text-[#89928b]">
                          {order.createdAt ? new Date(order.createdAt).toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "Date inconnue"}
                        </p>
                      </div>
                      <span className={`inline-flex rounded px-2 py-1 text-[11px] font-semibold sm:hidden ${orderStatusStyles[status] || "bg-[#eff1ef] text-[#68736b]"}`}>
                        {orderStatusLabels[status] || status}
                      </span>
                    </div>

                    <div className="min-w-0 space-y-1">
                      {items.length > 0 ? items.slice(0, 2).map((item, index) => {
                        const productInfo = getOrderItemInfo(item, productsById);
                        return (
                          <div key={`${order._id}-${index}`} className="flex min-w-0 items-baseline gap-2 text-xs">
                            <span className="min-w-0 truncate font-medium text-[#354139]">{productInfo.name}</span>
                            <span className="shrink-0 text-[#89928b]">× {numberFormat.format(item.quantity || 0)}</span>
                            {productInfo.collectionName && (
                              <span className="hidden shrink-0 truncate text-[#a0a8a2] md:inline">· {productInfo.collectionName}</span>
                            )}
                          </div>
                        );
                      }) : <span className="text-xs text-[#89928b]">Aucun article</span>}
                      {items.length > 2 && <p className="text-[11px] text-[#89928b]">+ {items.length - 2} autre{items.length > 3 ? "s" : ""} référence{items.length > 3 ? "s" : ""}</p>}
                      {items.length > 0 && !items.some((item) => getOrderItemInfo(item, productsById).collectionName) && (
                        <p className="text-[11px] text-[#a0a8a2]">Collection non renseignée</p>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-xs sm:block">
                      <span className="text-[#89928b] sm:hidden">Articles</span>
                      <span className="font-medium text-[#59655d]">{numberFormat.format(itemCount)} article{itemCount > 1 ? "s" : ""}</span>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end sm:gap-4">
                      <span className={`hidden rounded px-2 py-1 text-[11px] font-semibold sm:inline-flex ${orderStatusStyles[status] || "bg-[#eff1ef] text-[#68736b]"}`}>
                        {orderStatusLabels[status] || status}
                      </span>
                      <span className="text-xs text-[#89928b] sm:hidden">Total</span>
                      <span className="text-sm font-semibold text-[#29352e]">
                        {currencyFormat.format(Number(order.totalAmount) || 0)}
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <footer className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-[#e3e7e2] py-4 text-xs text-[#89928b]">
          <span className="inline-flex items-center gap-1.5"><ArrowUpRight size={14} className="text-[#39776d]" /> Confirmées et payées incluses</span>
          <span className="inline-flex items-center gap-1.5"><ArrowDownRight size={14} className="text-[#a17725]" /> En attente et annulées exclues</span>
        </footer>
      </div>
    </main>
  );
}

export default HomePage;
