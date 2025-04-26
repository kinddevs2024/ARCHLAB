function getYearsFrom2024ToNow() {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = 2020; year <= currentYear; year++) {
        years.push(year);
    }
    return years;
}

export default getYearsFrom2024ToNow;