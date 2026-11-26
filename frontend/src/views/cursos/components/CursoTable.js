import {
  CBadge,
  CButton,
  CButtonGroup,
  CFormInput,
  CFormSelect,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
  CSpinner,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilFilter, cilSearch } from '@coreui/icons'
import { useEffect, useState } from 'react'
import { SectionCard, StatusBadge, LoadingState } from '../../../components'
import Paginacion from '../../../components/Paginacion'

const CursoTable = ({
  cursos,
  onRegistrarCurso,
  seleccionarCurso,
  eliminarCurso,
  cursoParaEliminar,
  cancelarEliminacion,
  confirmarEliminacion,
  accionEnProceso,
  cargarCursos,
  profesores,
  cargando,
  paginaActual,
  setPaginaActual,
  registrosPorPagina,
  setRegistrosPorPagina,
  totalRegistros,
  totalPaginas,
  filtrosColumna,
  setFiltrosColumna,
}) => {
  const [filtroAbierto, setFiltroAbierto] = useState(null)

  const profesoresDisponibles = [
    ...new Set((profesores || []).map((prof) => `${prof.nombre} ${prof.a_paterno}`)),
  ]

  const hayFiltros = Object.values(filtrosColumna).some((valor) => valor && valor !== 'Activo')

  const actualizarFiltroColumna = (columna, valor) => {
    setFiltrosColumna((filtrosActuales) => ({ ...filtrosActuales, [columna]: valor }))
  }

  const renderEncabezadoFiltrable = (titulo, columna, tipo = 'text') => (
    <CTableHeaderCell scope="col" className="table-curso__head">
      <div className="table-curso__heading">
        <span>{titulo}</span>
        <button
          type="button"
          className={`table-curso__filter-toggle${filtrosColumna[columna] ? ' is-active' : ''}`}
          onClick={() => setFiltroAbierto(filtroAbierto === columna ? null : columna)}
          aria-label={`${filtroAbierto === columna ? 'Cerrar' : 'Abrir'} filtro de ${titulo}`}
          aria-expanded={filtroAbierto === columna}
          title={`Filtrar ${titulo}`}
        >
          <CIcon icon={tipo === 'select' ? cilFilter : cilSearch} />
        </button>
      </div>
      {filtroAbierto === columna && (
        <div className="table-curso__filter-control">
          {tipo === 'select' ? (
            <CFormSelect
              value={filtrosColumna[columna] || ''}
              onChange={(event) => actualizarFiltroColumna(columna, event.target.value)}
              aria-label={`Filtrar por ${titulo}`}
              size="sm"
            >
              <option value="">
                {columna === 'profesor' ? 'Todos los profesores' : 'Todos los estados'}
              </option>
              {(columna === 'profesor' ? profesoresDisponibles : ['Activo', 'Inactivo']).map(
                (opcion) => (
                  <option key={opcion} value={opcion}>
                    {String(opcion).charAt(0).toLocaleUpperCase() + String(opcion).slice(1)}
                  </option>
                ),
              )}
            </CFormSelect>
          ) : (
            <CFormInput
              type={tipo}
              value={filtrosColumna[columna] || ''}
              onChange={(event) => actualizarFiltroColumna(columna, event.target.value)}
              aria-label={`Filtrar por ${titulo}`}
              placeholder={`Filtrar ${titulo.toLocaleLowerCase()}`}
              size="sm"
              step={tipo === 'number' ? 'any' : undefined}
            />
          )}
        </div>
      )}
    </CTableHeaderCell>
  )

  return (
    <SectionCard>
      <div className="mb-4">
        <h2 className="bm-section-card-title mb-3 text-center">Cursos Registrados</h2>
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
          <p className="bm-section-card-description mb-0">
            {totalRegistros} curso{totalRegistros === 1 ? '' : 's'} encontrado
            {totalRegistros === 1 ? '' : 's'}
          </p>

          <CButton color="primary" onClick={onRegistrarCurso} className="cursos-page__cta">
            Registrar Curso
          </CButton>
        </div>
      </div>
      {cargando ? (
        <LoadingState label="Cargando cursos..." />
      ) : cursos.length === 0 && !hayFiltros ? (
        <div className="bm-table-empty">
          <strong>No hay cursos registrados</strong>
          <span>Los cursos que agregues aparecerán aquí.</span>
        </div>
      ) : (
        <div className="table-responsive table-curso__wrapper">
          <CTable align="middle" hover className="table-curso__table">
            <CTableHead>
              <CTableRow>
                <CTableHeaderCell scope="col" className="table-curso__head">
                  Nro
                </CTableHeaderCell>
                {renderEncabezadoFiltrable('Curso', 'curso')}
                {renderEncabezadoFiltrable('Profesor', 'profesor', 'select')}
                {renderEncabezadoFiltrable('Descripción', 'descripcion')}
                {renderEncabezadoFiltrable('Duración', 'duracion', 'search')}
                {renderEncabezadoFiltrable('Precio', 'precio', 'number')}
                {renderEncabezadoFiltrable('Cupos', 'cupos', 'number')}
                {renderEncabezadoFiltrable('Inicio', 'inicio', 'date')}
                {renderEncabezadoFiltrable('Fin', 'fin', 'date')}
                {renderEncabezadoFiltrable('Estado', 'estado', 'select')}
                <CTableHeaderCell scope="col" className="table-curso__head text-end">
                  Acciones
                </CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {cursos.length === 0 ? (
                <CTableRow>
                  <CTableDataCell colSpan={11} className="table-curso__empty-results">
                    No se encontraron coincidencias
                  </CTableDataCell>
                </CTableRow>
              ) : (
                cursos.map((curs, index) => {
                  const unidad =
                    curs.duracion && typeof curs.duracion === 'object'
                      ? Object.keys(curs.duracion)[0]
                      : null
                  const valor = unidad ? curs.duracion[unidad] : null
                  const unidades = {
                    days: 'días',
                    hours: 'horas',
                    months: 'meses',
                    weeks: 'semanas',
                  }

                  return (
                    <CTableRow key={curs.id_curso} className="table-curso__row">
                      <CTableDataCell className="table-curso__cell text-body-secondary">
                        #{(paginaActual - 1) * registrosPorPagina + index + 1}
                      </CTableDataCell>
                      <CTableDataCell className="table-curso__cell">
                        <strong>{curs.nombre}</strong>
                      </CTableDataCell>
                      <CTableDataCell className="table-curso__cell">
                        {curs.profesor_nombre ? (
                          curs.profesor_nombre
                        ) : (
                          <CBadge color="warning">Sin asignar</CBadge>
                        )}
                      </CTableDataCell>
                      <CTableDataCell className="table-curso__cell bm-table-description">
                        {curs.descripcion || 'Sin descripción'}
                      </CTableDataCell>
                      <CTableDataCell className="table-curso__cell">
                        {valor ? `${valor} ${unidades[unidad] || unidad}` : 'Sin duración'}
                      </CTableDataCell>
                      <CTableDataCell className="table-curso__cell">
                        {curs.costo ? `Bs. ${curs.costo}` : 'Sin precio'}
                      </CTableDataCell>
                      <CTableDataCell className="table-curso__cell">
                        {curs.cupo_total ?? '---'}
                      </CTableDataCell>
                      <CTableDataCell className="table-curso__cell">
                        {curs.fecha_creacion
                          ? new Date(curs.fecha_creacion).toLocaleDateString()
                          : '---'}
                      </CTableDataCell>
                      <CTableDataCell className="table-curso__cell">
                        {curs.fecha_fin ? new Date(curs.fecha_fin).toLocaleDateString() : '---'}
                      </CTableDataCell>
                      <CTableDataCell className="table-curso__cell">
                        <StatusBadge status={curs.estado || 'inactivo'}>
                          {curs.estado || 'Sin estado'}
                        </StatusBadge>
                      </CTableDataCell>
                      <CTableDataCell className="table-curso__cell text-end">
                        <CButtonGroup size="sm">
                          <CButton
                            color="primary"
                            variant="outline"
                            onClick={() => seleccionarCurso(curs)}
                            className="curso-table__action"
                          >
                            Editar
                          </CButton>

                          <CButton
                            color="danger"
                            variant="outline"
                            onClick={() => eliminarCurso(curs.id_curso)}
                            className="curso-table__action"
                          >
                            {curs.estado === 'Inactivo' ? 'Habilitar' : 'Eliminar'}
                          </CButton>
                        </CButtonGroup>
                      </CTableDataCell>
                    </CTableRow>
                  )
                })
              )}
            </CTableBody>
          </CTable>
          <Paginacion
            page={paginaActual}
            limit={registrosPorPagina}
            total={totalRegistros}
            totalPaginas={totalPaginas}
            etiqueta="cursos"
            onCambiarPagina={setPaginaActual}
            onCambiarLimite={(cantidad) => {
              setRegistrosPorPagina(cantidad)
              setPaginaActual(1)
            }}
          />
        </div>
      )}
      <CModal
        visible={Boolean(cursoParaEliminar)}
        onClose={cancelarEliminacion}
        portal={false}
        alignment="center"
      >
        <CModalHeader>
          <CModalTitle>Eliminar curso</CModalTitle>
        </CModalHeader>
        <CModalBody>Esta acción cambiará el estado del curso. ¿Deseas continuar?</CModalBody>
        <CModalFooter>
          <CButton
            color="secondary"
            variant="outline"
            onClick={cancelarEliminacion}
            disabled={Boolean(accionEnProceso)}
          >
            Cancelar
          </CButton>
          <CButton
            color="danger"
            onClick={confirmarEliminacion}
            disabled={Boolean(accionEnProceso)}
          >
            {accionEnProceso === 'eliminar' ? (
              <>
                <CSpinner size="sm" className="me-1" /> Procesando
              </>
            ) : (
              'Sí, actualizar'
            )}
          </CButton>
        </CModalFooter>
      </CModal>
    </SectionCard>
  )
}

export default CursoTable
