// uuid v4 на Math.random: id нужны уникальные только в пределах одного телефона,
// криптостойкость не важна, а пакет ради этого не ставим
export function makeId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.floor(Math.random() * 16);
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}
