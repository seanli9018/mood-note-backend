class APIFeatures {
  constructor(query, reqQuery) {
    this.query = query;
    this.reqQuery = reqQuery;
  }

  filter() {
    // Filtering
    const queryObj = { ...this.reqQuery };
    const excludedQueries = ['page', 'sort', 'limit', 'fields'];
    excludedQueries.forEach((excludedItem) => delete queryObj[excludedItem]);

    // Advanced filtering: gte, gt, lte, lt
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

    this.query = this.query.find(JSON.parse(queryStr));

    return this;
  }

  sort() {
    // Sorting
    if (this.reqQuery.sort) {
      // 'level -createdAt'
      const sortBy = this.reqQuery.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      // Default sorting by: createdAt descending.
      this.query = this.query.sort('-createdAt');
    }

    return this;
  }

  limitFields() {
    // Fields limiting
    if (this.reqQuery.fields) {
      // 'name level note'
      const fields = this.reqQuery.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      // Default fields limiting to exclude __v field
      this.query = this.query.select('-__v');
    }

    return this;
  }

  paginate() {
    // Pagination: default to 100 items per page.
    const page = this.reqQuery.page * 1 || 1;
    const limit = this.reqQuery.limit * 1 || 100;
    const skip = (page - 1) * limit;
    // TODO: pagination needs to be refined.
    this.query = this.query.skip(skip).limit(limit);

    return this;
  }
}

module.exports = APIFeatures;
