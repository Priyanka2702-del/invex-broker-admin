/** ISO timestamp + N seconds */
export const Date_ = (isoStr: string, sec: number) => new Date(Date.parse(isoStr) + sec * 1000).toISOString();
