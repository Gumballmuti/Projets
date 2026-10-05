const court = new Intl.DateTimeFormat("fr-BE", { day: "numeric", month: "short" });
const long = new Intl.DateTimeFormat("fr-BE", { weekday: "long", day: "numeric", month: "long" });

export const dateCourte = (iso: string) => court.format(new Date(iso));
export const dateLongue = (iso: string) => long.format(new Date(iso));
