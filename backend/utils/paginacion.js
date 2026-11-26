export const obtenerPaginacion = (query) => {
  // ?todos=true devuelve todo sin paginar (para selects, búsquedas y reportes)
  if (query.todos === 'true') return { page: 1, limit: null, offset: 0 }

  let page = parseInt(query.page, 10)
  let limit = parseInt(query.limit, 10)

  if (!Number.isInteger(page) || page < 1) page = 1
  if (!Number.isInteger(limit) || limit < 1) limit = 10
  if (limit > 100) limit = 100

  const offset = (page - 1) * limit
  return { page, limit, offset }
}

export const armarRespuestaPaginada = (datos, total, page, limit) => ({
  datos,
  paginacion: {
    total,
    page,
    limit: limit ?? total,
    totalPaginas: limit ? Math.ceil(total / limit) : 1
  }
})
