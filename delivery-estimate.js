// Calendar arithmetic uses Romanian local dates, independent of the device timezone.
function getOrderDeliveryEstimate(createdAt) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Bucharest", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hourCycle: "h23"
  }).formatToParts(new Date(createdAt));
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  const date = new Date(Date.UTC(+values.year, +values.month - 1, +values.day));
  const isWorkday = (day) => ![0, 6].includes(day.getUTCDay());
  const nextWorkday = (day) => {
    const next = new Date(day);
    do next.setUTCDate(next.getUTCDate() + 1); while (!isWorkday(next));
    return next;
  };
  const beforeCutoff = isWorkday(date) && +values.hour < 16;
  const dispatch = beforeCutoff ? date : nextWorkday(date);
  const first = nextWorkday(dispatch);
  const last = nextWorkday(first);
  const format = (day) => new Intl.DateTimeFormat("ro-RO", {
    timeZone: "UTC", weekday: "long", day: "numeric", month: "long"
  }).format(day);
  const tomorrow = (first - date) / 86400000 === 1;
  return {
    title: beforeCutoff ? `Livrare estimată ${tomorrow ? "mâine, " : ""}${format(first)}` : `Livrare estimată: ${format(first)} – ${format(last)}`,
    explanation: beforeCutoff
      ? "Comandă plasată înainte de 16:00. Livrare în 1–2 zile lucrătoare, fără weekend."
      : "Expediere în următoarea zi lucrătoare, apoi livrare în 1–2 zile lucrătoare. Weekendul nu se include.",
    first: first.toISOString().slice(0, 10), last: last.toISOString().slice(0, 10), beforeCutoff
  };
}
