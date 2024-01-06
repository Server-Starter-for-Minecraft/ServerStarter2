
function paddedNumber(n: number, digit: number) {
    return n.toString().padStart(digit, '0');
}

export class DateForFormatter {
    date: Date
    constructor(date: Date) {
        this.date = date
    }

    get YYYY() {
        return paddedNumber(this.date.getFullYear(), 4)
    }

    get MM() {
        return paddedNumber(this.date.getMonth() + 1, 2)
    }

    get DD() {
        return paddedNumber(this.date.getDate(), 2)
    }

    get HH() {
        return paddedNumber(this.date.getHours(), 2)
    }

}

export class DateFormatter {
    formatter: (date: DateForFormatter) => string
    constructor(formatter: (date: DateForFormatter) => string) {
        this.formatter = formatter
    }
    format(date: Date) {
        return this.formatter(new DateForFormatter(date))
    }
}
