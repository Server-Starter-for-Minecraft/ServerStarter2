function paddedNumber(n: number, digit: number) {
  return n.toString().padStart(digit, '0');
}

const monthNames = [
  ['January', 'Jan'],
  ['February', 'Feb'],
  ['March', 'Mar'],
  ['April', 'Apr'],
  ['May', 'May'],
  ['June', 'Jun'],
  ['July', 'Jul'],
  ['August', 'Aug'],
  ['September', 'Sep'],
  ['October', 'Oct'],
  ['November', 'Nov'],
  ['December', 'Dec'],
];

const dateNames = [
  ['Sunday', 'Sun'],
  ['Monday', 'Mon'],
  ['Tuesday', 'Tues'],
  ['Wednesday', 'Wed'],
  ['Thursday', 'Thurs'],
  ['Friday', 'Fri'],
  ['Saturday', 'Sat'],
];

export class DateForFormatter {
  date: Date;
  constructor(date: Date) {
    this.date = date;
  }

  get YYYY() {
    return paddedNumber(this.date.getFullYear(), 4);
  }

  get MM() {
    return paddedNumber(this.date.getMonth() + 1, 2);
  }

  get DD() {
    return paddedNumber(this.date.getDate(), 2);
  }

  get HH() {
    return paddedNumber(this.date.getHours(), 2);
  }

  get mm() {
    return paddedNumber(this.date.getMinutes(), 2);
  }

  get ss() {
    return paddedNumber(this.date.getSeconds(), 2);
  }

  /** Sun-Sat */
  get ddd() {
    return dateNames[this.date.getDay()][1];
  }

  /** Sundat-Saturday */
  get dddd() {
    return dateNames[this.date.getDay()][0];
  }

  /** Jan / Feb / Mar / Apr / May / Jun / Jul / Aug / Sep / Oct / Nov / Dec */
  get Mth() {
    return monthNames[this.date.getMonth()][1];
  }

  /** January / February / March / April / May / June / July / August / September / October / November / December */
  get Month() {
    return monthNames[this.date.getMonth()][0];
  }
}

export class DateFormatter {
  formatter: (date: DateForFormatter) => string;
  constructor(formatter: (date: DateForFormatter) => string) {
    this.formatter = formatter;
  }
  format(date: Date) {
    return this.formatter(new DateForFormatter(date));
  }
}
