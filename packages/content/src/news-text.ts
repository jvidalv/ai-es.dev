const dayFormatter = new Intl.DateTimeFormat("es", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "UTC",
});
export function dayLabel(date: string) {
  const label = dayFormatter.format(new Date(`${date}T12:00:00Z`));
  return label.charAt(0).toUpperCase() + label.slice(1);
}

// A fact cut short by the generator already ends in an ellipsis, so it must not gain a period.
export function newsSentence(fact: string) {
  return /[.!?…]$/.test(fact) ? fact : `${fact}.`;
}
