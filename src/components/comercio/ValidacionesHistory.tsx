'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  alpha,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  IconButton,
  Pagination,
  InputAdornment,
} from '@mui/material';
import {
  Receipt,
  CheckCircle,
  Cancel,
  Warning,
  Search,
  Download,
  Refresh,
  TrendingUp,
} from '@mui/icons-material';
import { useValidaciones } from '@/hooks/useValidaciones';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const ITEMS_PER_PAGE = 10;

const RESULTADO_COLORS = {
  valido: '#10b981',
  invalido: '#ef4444',
  vencido: '#f59e0b',
  agotado: '#f97316',
  no_autorizado: '#6b7280',
};

const RESULTADO_LABELS = {
  valido: 'Válido',
  invalido: 'Inválido',
  vencido: 'Vencido',
  agotado: 'Agotado',
  no_autorizado: 'No Autorizado',
};

export const ValidacionesHistory: React.FC = () => {
  const { validaciones, loading, getStats, loadMore, hasMore } = useValidaciones();
  const [searchTerm, setSearchTerm] = useState('');
  const [resultadoFilter, setResultadoFilter] = useState<string>('all');
  const [fechaFilter, setFechaFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);

  const stats = getStats();

  // Filter validaciones
  const filteredValidaciones = useMemo(() => {
    return validaciones.filter(validacion => {
      // Search filter
      const matchesSearch = searchTerm === '' || 
        validacion.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        validacion.socioId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        validacion.beneficioId.toLowerCase().includes(searchTerm.toLowerCase());

      // Result filter
      const matchesResultado = resultadoFilter === 'all' || validacion.resultado === resultadoFilter;

      // Date filter
      let matchesFecha = true;
      if (fechaFilter !== 'all') {
        const now = new Date();
        const validacionDate = validacion.fechaHora.toDate();
        
        switch (fechaFilter) {
          case 'today':
            matchesFecha = validacionDate.toDateString() === now.toDateString();
            break;
          case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            matchesFecha = validacionDate >= weekAgo;
            break;
          case 'month':
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            matchesFecha = validacionDate >= monthAgo;
            break;
        }
      }

      return matchesSearch && matchesResultado && matchesFecha;
    });
  }, [validaciones, searchTerm, resultadoFilter, fechaFilter]);

  // Paginate results
  const totalPages = Math.ceil(filteredValidaciones.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedValidaciones = filteredValidaciones.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const getResultadoIcon = (resultado: string) => {
    switch (resultado) {
      case 'valido': return <CheckCircle />;
      case 'invalido': return <Cancel />;
      case 'vencido': return <Warning />;
      case 'agotado': return <Warning />;
      case 'no_autorizado': return <Cancel />;
      default: return <Receipt />;
    }
  };

  const exportValidaciones = () => {
    const csvContent = [
      ['Fecha', 'Hora', 'Socio ID', 'Beneficio ID', 'Resultado', 'Monto', 'Descuento'].join(','),
      ...filteredValidaciones.map(v => [
        format(v.fechaHora.toDate(), 'dd/MM/yyyy', { locale: es }),
        format(v.fechaHora.toDate(), 'HH:mm', { locale: es }),
        v.socioId,
        v.beneficioId,
        RESULTADO_LABELS[v.resultado as keyof typeof RESULTADO_LABELS],
        v.montoTransaccion || 0,
        v.descuentoAplicado || 0,
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `validaciones-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading && validaciones.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Avatar sx={{ width: 60, height: 60, bgcolor: '#06b6d4' }}>
            <Receipt sx={{ fontSize: 30 }} />
          </Avatar>
        </motion.div>
      </Box>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#1e293b', mb: 1 }}>
            Historial de Validaciones
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            Revisa todas las validaciones realizadas en tu comercio
          </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={exportValidaciones}
            sx={{
              borderColor: '#06b6d4',
              color: '#06b6d4',
              '&:hover': {
                borderColor: '#0891b2',
                bgcolor: alpha('#06b6d4', 0.1),
              }
            }}
          >
            Exportar
          </Button>
          <IconButton
            onClick={() => window.location.reload()}
            sx={{
              bgcolor: alpha('#06b6d4', 0.1),
              color: '#06b6d4',
              '&:hover': {
                bgcolor: alpha('#06b6d4', 0.2),
              }
            }}
          >
            <Refresh />
          </IconButton>
        </Stack>
      </Stack>

      {/* Stats Cards */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(4, 1fr)',
          },
          gap: 3,
          mb: 4,
        }}
      >
        {[
          {
            title: 'Total Validaciones',
            value: stats.totalValidaciones,
            icon: <Receipt />,
            color: '#06b6d4',
            change: '+12%',
          },
          {
            title: 'Validaciones Exitosas',
            value: stats.validacionesExitosas,
            icon: <CheckCircle />,
            color: '#10b981',
            change: '+8%',
          },
          {
            title: 'Validaciones Fallidas',
            value: stats.validacionesFallidas,
            icon: <Cancel />,
            color: '#ef4444',
            change: '-3%',
          },
          {
            title: 'Tasa de Éxito',
            value: `${stats.totalValidaciones > 0 ? ((stats.validacionesExitosas / stats.totalValidaciones) * 100).toFixed(1) : 0}%`,
            icon: <TrendingUp />,
            color: '#8b5cf6',
            change: '+2%',
          },
        ].map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Card
              elevation={0}
              sx={{
                p: 3,
                background: 'white',
                border: '1px solid #f1f5f9',
                borderRadius: 3,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.1)',
                }
              }}
            >
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar
                  sx={{
                    bgcolor: alpha(stat.color, 0.1),
                    color: stat.color,
                    width: 48,
                    height: 48,
                  }}
                >
                  {stat.icon}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h4" sx={{ fontWeight: 900, color: '#1e293b' }}>
                    {stat.value}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#64748b', mb: 1 }}>
                    {stat.title}
                  </Typography>
                  <Chip
                    label={stat.change}
                    size="small"
                    sx={{
                      bgcolor: stat.change.startsWith('+') ? alpha('#10b981', 0.1) : alpha('#ef4444', 0.1),
                      color: stat.change.startsWith('+') ? '#10b981' : '#ef4444',
                      fontWeight: 600,
                      fontSize: '0.7rem',
                    }}
                  />
                </Box>
              </Stack>
            </Card>
          </motion.div>
        ))}
      </Box>

      {/* Filters */}
      <Card
        elevation={0}
        sx={{
          background: 'white',
          border: '1px solid #f1f5f9',
          borderRadius: 3,
          mb: 3,
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                md: '2fr 1fr 1fr auto',
              },
              gap: 3,
              alignItems: 'center',
            }}
          >
            <TextField
              fullWidth
              placeholder="Buscar por ID de validación, socio o beneficio..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ color: '#94a3b8' }} />
                    </InputAdornment>
                  ),
                }
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  '&.Mui-focused fieldset': {
                    borderColor: '#06b6d4',
                  }
                }
              }}
            />
            
            <FormControl fullWidth>
              <InputLabel>Resultado</InputLabel>
              <Select
                value={resultadoFilter}
                label="Resultado"
                onChange={(e) => setResultadoFilter(e.target.value)}
                sx={{
                  borderRadius: 2,
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#06b6d4',
                  }
                }}
              >
                <MenuItem value="all">Todos los resultados</MenuItem>
                {Object.entries(RESULTADO_LABELS).map(([key, label]) => (
                  <MenuItem key={key} value={key}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Avatar
                        sx={{
                          bgcolor: alpha(RESULTADO_COLORS[key as keyof typeof RESULTADO_COLORS], 0.1),
                          color: RESULTADO_COLORS[key as keyof typeof RESULTADO_COLORS],
                          width: 24,
                          height: 24,
                        }}
                      >
                        {getResultadoIcon(key)}
                      </Avatar>
                      <Typography>{label}</Typography>
                    </Stack>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormControl fullWidth>
              <InputLabel>Período</InputLabel>
              <Select
                value={fechaFilter}
                label="Período"
                onChange={(e) => setFechaFilter(e.target.value)}
                sx={{
                  borderRadius: 2,
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#06b6d4',
                  }
                }}
              >
                <MenuItem value="all">Todos los períodos</MenuItem>
                <MenuItem value="today">Hoy</MenuItem>
                <MenuItem value="week">Última semana</MenuItem>
                <MenuItem value="month">Último mes</MenuItem>
              </Select>
            </FormControl>
            
            <Box sx={{ textAlign: 'center', minWidth: 'fit-content' }}>
              <Typography variant="body2" sx={{ color: '#64748b' }}>
                {filteredValidaciones.length} resultado{filteredValidaciones.length !== 1 ? 's' : ''}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Validations Table */}
      <Card
        elevation={0}
        sx={{
          background: 'white',
          border: '1px solid #f1f5f9',
          borderRadius: 3,
        }}
      >
        <CardContent sx={{ p: 0 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#fafbfc' }}>
                  <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Fecha y Hora</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Socio</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Beneficio</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Resultado</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Monto</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Descuento</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <AnimatePresence>
                  {paginatedValidaciones.map((validacion, index) => (
                    <motion.div
                      key={validacion.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      style={{ display: 'contents' }}
                    >
                      <TableRow
                        sx={{
                          '&:hover': {
                            bgcolor: alpha('#06b6d4', 0.05),
                          }
                        }}
                      >
                        <TableCell>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b' }}>
                              {format(validacion.fechaHora.toDate(), 'dd/MM/yyyy', { locale: es })}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#64748b' }}>
                              {format(validacion.fechaHora.toDate(), 'HH:mm', { locale: es })}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace', color: '#64748b' }}>
                            {validacion.socioId.substring(0, 8)}...
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace', color: '#64748b' }}>
                            {validacion.beneficioId.substring(0, 8)}...
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={getResultadoIcon(validacion.resultado)}
                            label={RESULTADO_LABELS[validacion.resultado as keyof typeof RESULTADO_LABELS]}
                            size="small"
                            sx={{
                              bgcolor: alpha(RESULTADO_COLORS[validacion.resultado as keyof typeof RESULTADO_COLORS], 0.1),
                              color: RESULTADO_COLORS[validacion.resultado as keyof typeof RESULTADO_COLORS],
                              fontWeight: 600,
                              '& .MuiChip-icon': {
                                fontSize: 16,
                              }
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {validacion.montoTransaccion ? `$${validacion.montoTransaccion.toFixed(2)}` : '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#10b981' }}>
                            {validacion.descuentoAplicado ? `$${validacion.descuentoAplicado.toFixed(2)}` : '-'}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </TableBody>
            </Table>
          </TableContainer>

          {filteredValidaciones.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Avatar
                sx={{
                  width: 80,
                  height: 80,
                  bgcolor: alpha('#06b6d4', 0.1),
                  color: '#06b6d4',
                  mx: 'auto',
                  mb: 3,
                }}
              >
                <Receipt sx={{ fontSize: 40 }} />
              </Avatar>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b', mb: 1 }}>
                No se encontraron validaciones
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b' }}>
                {searchTerm || resultadoFilter !== 'all' || fechaFilter !== 'all'
                  ? 'Intenta ajustar los filtros de búsqueda'
                  : 'Las validaciones aparecerán aquí cuando los socios usen tus beneficios'
                }
              </Typography>
            </Box>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={(_, page) => setCurrentPage(page)}
                color="primary"
                sx={{
                  '& .MuiPaginationItem-root': {
                    '&.Mui-selected': {
                      bgcolor: '#06b6d4',
                      '&:hover': {
                        bgcolor: '#0891b2',
                      }
                    }
                  }
                }}
              />
            </Box>
          )}

          {/* Load More Button */}
          {hasMore && (
            <Box sx={{ textAlign: 'center', p: 3 }}>
              <Button
                variant="outlined"
                onClick={loadMore}
                disabled={loading}
                sx={{
                  borderColor: '#06b6d4',
                  color: '#06b6d4',
                  '&:hover': {
                    borderColor: '#0891b2',
                    bgcolor: alpha('#06b6d4', 0.1),
                  }
                }}
              >
                {loading ? 'Cargando...' : 'Cargar más validaciones'}
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};