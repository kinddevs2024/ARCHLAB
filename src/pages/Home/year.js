function getYearsFrom2024ToNow() {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = 2000; year <= currentYear; year++) {
        if (year > currentYear - 6) {
            years.push(year);
        }
    }
    return years;
}

export default getYearsFrom2024ToNow;