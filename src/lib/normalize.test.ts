import { normalize } from '@/lib/normalize';

describe('normalize', () => {
  it.each([
    ['двадцать седьмого августа', '27 августа'],
    ['в девять сорок пять', 'в 9 45'],
    ['Завтра, в 9.', 'Завтра  в 9 '],
    ['15:00', '15:00'],
    ['27.08.2027', '27.08.2027'],
    ['полвосьмого', 'половине 8'],
    ['без двадцати пяти девять', 'без 25 9'],
    ['каждое первое число', 'каждое 1 число'],
    ['вечером днём', 'вечером днем'],
    ['купить хлеб', 'купить хлеб'],
  ])('«%s» → «%s»', (text, expected) => {
    expect(normalize(text).text).toBe(expected);
  });

  it('карта ведёт из найденного обратно на исходные слова', () => {
    const source = 'купить через два дня хлеб';
    const n = normalize(source);
    const from = n.text.indexOf('2 дня');
    expect(source.slice(n.start[from], n.end[from + '2 дня'.length])).toBe('два дня');
  });

  it('у карты по позиции на каждый символ', () => {
    const n = normalize('в девять сорок пять');
    expect(n.start).toHaveLength(n.text.length);
    expect(n.end).toHaveLength(n.text.length + 1);
  });
});
