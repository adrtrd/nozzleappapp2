import React from 'react';
import * as Icons from 'lucide-react';
import { useSettingsStore } from '../store/settingsStore';
import { useStore } from '../store/store';

export const LucideIcon = ({ 
  name, 
  className, 
  style, 
  size = 16 
}: { 
  name: string; 
  className?: string; 
  style?: React.CSSProperties; 
  size?: number;
}) => {
  const IconComponent = (Icons as any)[name];
  if (!IconComponent) return null;
  return <IconComponent className={className} style={style} size={size} />;
};

export const toArabicNumerals = (str: string): string => {
  if (!str) return '';
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return String(str).replace(/[0-9]/g, (w) => arabicDigits[parseInt(w)]);
};

export const toLatinNumerals = (str: string): string => {
  if (!str) return '';
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return String(str).replace(/[٠-٩]/g, (w) => {
    const idx = arabicDigits.indexOf(w);
    return idx !== -1 ? String(idx) : w;
  });
};

export function InvoicePrintView({
  id,
  visit,
  customer,
  car,
  services,
  currentVisitServices,
  invoice,
  payment,
  settings,
  invoiceSettings,
  technician,
  isLivePreview
}: {
  id?: string;
  visit: any;
  customer: any;
  car: any;
  services?: any[];
  currentVisitServices?: any[];
  invoice: any;
  payment?: any;
  settings?: any;
  invoiceSettings?: any;
  technician?: any;
  isLivePreview?: boolean;
}) {

  const S = useSettingsStore((s) => s.invoice) || {};

  const BG      = S.headerBgColor  || '#0F172A';
  const FG      = S.headerTextColor|| '#FFFFFF';
  const ACCENT  = S.accentColor    || '#6366F1';
  const FONT    = S.fontFamily     || 'Tajawal';
  const NAME    = S.centerName     || 'مركز الخدمة';
  const PHONE   = S.phone          || '';
  const ADDR    = S.address        || '';
  const FOOTER  = S.footerText     ||
                  'شكراً لثقتكم — نتمنى لكم قيادة آمنة';
  const LOGO    = S.logoBase64     || null;

  // Dynamically resolve technician name from users store
  const users = useStore((state: any) => state.users) || [];
  const resolvedTechnician = users.find((u: any) => u.id === visit?.technicianId)?.name;
  const techName = visit?.technicianName || resolvedTechnician || (technician && typeof technician === 'object' ? technician.name : technician) || '—';

  const safe = Array.isArray(services)
    ? services
    : Array.isArray(currentVisitServices)
      ? currentVisitServices
      : Array.isArray(visit?.services)
        ? visit.services
        : [];

  const subtotal  = Number(invoice?.subtotal       || visit?.subtotal || 0);
  const discount  = Number(invoice?.discountAmount || visit?.discountAmount || 0);
  const tax       = Number(invoice?.taxAmount      || visit?.taxAmount || 0);
  const total     = Number(invoice?.total          || visit?.total || 0);
  const paid      = Number(invoice?.totalPaid      || visit?.totalPaid || 0);
  const remaining = Number(invoice?.totalRemaining || visit?.totalRemaining || 0);

  const fmt = (n: any) =>
    Number(n || 0).toLocaleString('ar-IQ') + ' د.ع';

  const rawMethod = invoice?.paymentMethod || payment?.method || visit?.paymentMethod || visit?.payment?.method || '';
  let paymentMethodStr = '—';
  if (rawMethod === 'cash') paymentMethodStr = 'نقدي';
  else if (rawMethod === 'electronic') paymentMethodStr = 'إلكتروني';
  else if (rawMethod === 'deferred') paymentMethodStr = 'آجل';
  else if (rawMethod === 'partial') paymentMethodStr = 'جزئي';
  else if (rawMethod) paymentMethodStr = rawMethod;

  // ROOT — fixed A4 size with 12mm page margin
  return (
    <div id={id} style={{
      width:      '210mm',
      minHeight:  '297mm',
      maxWidth:   '210mm',
      background: '#ffffff',
      color:      '#0F172A',
      fontFamily: `'${FONT}', 'Tajawal', Arial, sans-serif`,
      fontSize:   '9.5pt',
      lineHeight: '1.5',
      direction:  'rtl',
      boxSizing:  'border-box',
      margin:     '0 auto',
      padding:    '12mm', /* Creates 12mm print margins */
    }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', border: 'none' }}>
        <thead className="print-margin-spacer" style={{ display: 'none' }}>
          <tr>
            <td>
              <div style={{ height: '12mm' }}></div>
            </td>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>

      {/* ══ HEADER (Rounded Card) ══ */}
      <div className="no-break" style={{
        background:   BG,
        padding:      '16pt 20pt',
        borderRadius: '14pt', /* Curved header corners */
        marginBottom: '12pt',
      }}>
        <table style={{
          width:          '100%',
          borderCollapse: 'collapse',
        }}>
          <tbody>
            <tr>
              {/* Logo */}
              <td style={{
                width:         '22%',
                verticalAlign: 'middle',
              }}>
                {LOGO ? (
                  <img
                    src={LOGO}
                    style={{
                      height:     '48pt',
                      width:      'auto',
                      objectFit:  'contain',
                      display:    'block',
                    }}
                  />
                ) : (
                  <div style={{
                    width:          '48pt',
                    height:         '48pt',
                    borderRadius:   '50%',
                    background:     ACCENT,
                    display:        'flex',
                    alignItems:     'center',
                    justifyContent: 'center',
                    color:          '#fff',
                    fontSize:       '20pt',
                    fontWeight:     '700',
                  }}>
                    {NAME.charAt(0)}
                  </div>
                )}
              </td>

              {/* Center name */}
              <td style={{
                width:         '56%',
                textAlign:     'center',
                verticalAlign: 'middle',
              }}>
                <div style={{
                  color:      FG,
                  fontSize:   '16pt',
                  fontWeight: '700',
                }}>
                  {NAME}
                </div>
                {S.tagline && (
                  <div style={{
                    color:     '#94A3B8',
                    fontSize:  '8.5pt',
                    marginTop: '2pt',
                  }}>
                    {S.tagline}
                  </div>
                )}
                {PHONE && (
                  <div style={{
                    color:     '#94A3B8',
                    fontSize:  '8.5pt',
                    marginTop: '1pt',
                  }}>
                    {PHONE}
                  </div>
                )}
                {ADDR && (
                  <div style={{
                    color:     '#94A3B8',
                    fontSize:  '8pt',
                    marginTop: '1pt',
                  }}>
                    {ADDR}
                  </div>
                )}
              </td>

              {/* Invoice number */}
              <td style={{
                width:         '22%',
                textAlign:     'left',
                verticalAlign: 'middle',
              }}>
                <div style={{
                  color:     '#94A3B8',
                  fontSize:  '7.5pt',
                }}>
                  رقم الفاتورة
                </div>
                <div style={{
                  color:      ACCENT,
                  fontSize:   '17pt',
                  fontWeight: '700',
                  lineHeight: '1.2',
                }}>
                  {invoice?.invoiceNumber || visit?.invoiceNumber || 'INV-0001'}
                </div>
                <div style={{
                  color:     '#94A3B8',
                  fontSize:  '8pt',
                  marginTop: '3pt',
                }}>
                  {visit?.entryDate
                    ? new Date(visit.entryDate)
                        .toLocaleDateString('ar-IQ')
                    : ''}
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ══ BODY ══ */}
      <div style={{ padding: '0' }}>

        {/* ── CUSTOMER + VISIT (Rounded Table Wrapper) ── */}
        <div className="no-break rounded-wrapper" style={{
          border: '0.5pt solid #E2E8F0',
          borderRadius: '12pt', /* Curved corners */
          overflow: 'hidden',   /* Retain rounding on cells */
          marginBottom: '12pt',
        }}>
          <table style={{
            width:          '100%',
            borderCollapse: 'collapse',
          }}>
            <tbody>
              <tr>
                <td style={{
                  width:         '50%',
                  padding:       '10pt 12pt',
                  verticalAlign: 'top',
                  borderLeft:    '0.5pt solid #E2E8F0',
                }}>
                  <div style={{
                    color:          ACCENT,
                    fontSize:       '7.5pt',
                    fontWeight:     '700',
                    letterSpacing:  '0.7pt',
                    marginBottom:   '5pt',
                  }}>
                    بيانات العميل
                  </div>
                  <div style={{
                    fontSize:   '11pt',
                    fontWeight: '700',
                    marginBottom:'2pt',
                  }}>
                    {customer?.name || '—'}
                  </div>
                  <div style={{ color:'#64748B', fontSize:'8.5pt' }}>
                    {customer?.phone || ''}
                  </div>
                  <div style={{ color:'#64748B', fontSize:'8.5pt' }}>
                    {customer?.address || ''}
                  </div>
                </td>
                <td style={{
                  width:         '50%',
                  padding:       '10pt 12pt',
                  verticalAlign: 'top',
                }}>
                  <div style={{
                    color:         ACCENT,
                    fontSize:      '7.5pt',
                    fontWeight:    '700',
                    letterSpacing: '0.7pt',
                    marginBottom:  '5pt',
                  }}>
                    بيانات الزيارة
                  </div>
                  <table style={{ borderCollapse:'collapse' }}>
                    <tbody>
                      {[
                        ['تاريخ الدخول',
                          visit?.entryDate
                            ? new Date(visit.entryDate)
                                .toLocaleDateString('ar-IQ')
                            : '—'],
                        ['الفني', techName],
                        ['العداد',
                          visit?.entryOdometer
                            ? visit.entryOdometer + ' كم'
                            : '—'],
                      ].map(([lbl, val]) => (
                        <tr key={lbl}>
                          <td style={{
                            color:        '#64748B',
                            fontSize:     '8.5pt',
                            paddingLeft:  '10pt',
                            paddingBottom:'2pt',
                            whiteSpace:   'nowrap',
                          }}>
                            {lbl}:
                          </td>
                          <td style={{
                            fontSize:     '8.5pt',
                            fontWeight:   '500',
                            paddingBottom:'2pt',
                          }}>
                            {val}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* ── CAR INFO (Rounded Table Wrapper without Odometer) ── */}
        {car && (
          <div className="no-break rounded-wrapper" style={{
            border: '0.5pt solid #E2E8F0',
            borderRadius: '12pt', /* Curved corners */
            overflow: 'hidden',
            background: '#F8FAFC',
            marginBottom: '12pt',
          }}>
            <table style={{
              width:          '100%',
              borderCollapse: 'collapse',
            }}>
              <tbody>
                <tr>
                  {[
                    { l:'السيارة',
                      v:`${car.brand||''} ${car.name||''}` },
                    { l:'السنة',    v: car.year        || '—' },
                    { l:'اللون',    v: car.color       || '—' },
                    { l:'اللوحة',   v: car.plateNumber || '—' },
                    { l:'الشاصي',
                      v: car.chassisNumber
                        ? car.chassisNumber.slice(-8)
                        : '—' },
                  ].map((item: any, i: number) => (
                    <td key={i} style={{
                      padding:     '8pt 9pt',
                      borderRight: i < 4
                        ? '0.5pt solid #E2E8F0' : 'none',
                      fontSize:    '8.5pt',
                    }}>
                      <div style={{
                        color:    '#64748B',
                        fontSize: '7.5pt',
                      }}>
                        {item.l}
                      </div>
                      <div style={{
                        fontWeight: '600',
                        marginTop:  '2pt',
                      }}>
                        {item.v}
                      </div>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* ── SERVICES TABLE (Rounded Table Wrapper) ── */}
        <div className="rounded-wrapper services-table-wrapper" style={{
          border: '0.5pt solid #E2E8F0',
          borderRadius: '12pt', /* Curved corners */
          overflow: 'hidden',
          marginBottom: '10pt',
        }}>
          <table style={{
            width:          '100%',
            borderCollapse: 'collapse',
            fontSize:       '8.5pt',
          }}>
            <colgroup>
              <col style={{ width: '4%'  }} />
              <col style={{ width: '20%' }} />
              <col style={{ width: '36%' }} />
              <col style={{ width: '10%' }} />
              <col style={{ width: '14%' }} />
              <col style={{ width: '16%' }} />
            </colgroup>
            <thead>
              <tr style={{ background: BG }}>
                {['#','الخدمة','التفاصيل',
                  'الكمية','سعر الوحدة','الإجمالي']
                  .map((h: string, i: number) => (
                  <th key={i} style={{
                    padding:    '8pt 6pt',
                    textAlign:  'right',
                    color:      FG,
                    fontWeight: '600',
                    fontSize:   '8.5pt',
                    border:     'none',
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {safe.map((srv: any, idx: number) => (
                <tr
                  key={srv.id || idx}
                  style={{
                    background:      idx % 2 === 0
                      ? '#ffffff' : '#F8FAFC',
                    pageBreakInside: 'avoid',
                  }}
                >
                  <td style={{
                    padding:       '6pt 5pt',
                    textAlign:     'center',
                    borderBottom:  idx < safe.length - 1 ? '0.5pt solid #E2E8F0' : 'none',
                    color:         '#64748B',
                  }}>
                    {idx + 1}
                  </td>
                  <td style={{
                    padding:      '6pt 5pt',
                    borderBottom: idx < safe.length - 1 ? '0.5pt solid #E2E8F0' : 'none',
                  }}>
                    {srv.categoryName && (
                      <span style={{
                        background:    '#FEF3C7',
                        color:         '#92400E',
                        padding:       '1pt 4pt',
                        borderRadius:  '6pt',
                        fontSize:      '7.5pt',
                        fontWeight:    '600',
                        display:       'inline-block',
                        marginBottom:  '2pt',
                      }}>
                        {srv.categoryName}
                      </span>
                    )}
                    <div style={{ fontWeight: '600' }}>
                      {srv.serviceName || srv.name || ''}
                    </div>
                  </td>
                  <td style={{
                    padding:      '6pt 5pt',
                    borderBottom: idx < safe.length - 1 ? '0.5pt solid #E2E8F0' : 'none',
                    color:        '#334155',
                    lineHeight:   '1.5',
                  }}>
                    {srv.oilDetails ? (
                      <>
                        {srv.oilDetails.brand &&
                          <div>
                            الشركة: {srv.oilDetails.brand}
                            {srv.oilDetails.productName &&
                              ` — ${srv.oilDetails.productName}`}
                          </div>
                        }
                        {srv.oilDetails.oilType &&
                          <div>النوع: {srv.oilDetails.oilType}</div>}
                        {srv.oilDetails.viscosity &&
                          <div>اللزوجة: {srv.oilDetails.viscosity}</div>}
                        {srv.oilDetails.litersUsed &&
                          <div>
                            الكمية: {srv.oilDetails.litersUsed} لتر
                          </div>}
                        {srv.oilDetails.nextChangeOdometer &&
                          <div>
                            العداد القادم:{' '}
                            {srv.oilDetails.nextChangeOdometer} كم
                          </div>}
                        {srv.oilDetails.nextChangeDate &&
                          <div>
                            التاريخ القادم:{' '}
                            {srv.oilDetails.nextChangeDate}
                          </div>}
                        {srv.oilDetails.dotGrade &&
                          <div>
                            درجة الدوط: {srv.oilDetails.dotGrade}
                          </div>}
                        {srv.oilDetails.axle &&
                          <div>المحور: {srv.oilDetails.axle}</div>}
                      </>
                    ) : (
                      <div>{srv.notes || ''}</div>
                    )}
                  </td>
                  <td style={{
                    padding:      '6pt 5pt',
                    textAlign:    'center',
                    borderBottom: idx < safe.length - 1 ? '0.5pt solid #E2E8F0' : 'none',
                  }}>
                    {srv.qty || 1} {srv.unit || ''}
                  </td>
                  <td style={{
                    padding:      '6pt 5pt',
                    textAlign:    'center',
                    borderBottom: idx < safe.length - 1 ? '0.5pt solid #E2E8F0' : 'none',
                  }}>
                    {Number(srv.unitPrice || 0)
                      .toLocaleString('ar-IQ')} د.ع
                  </td>
                  <td style={{
                    padding:      '6pt 5pt',
                    textAlign:    'center',
                    fontWeight:   '700',
                    fontSize:     '9.5pt',
                    borderBottom: idx < safe.length - 1 ? '0.5pt solid #E2E8F0' : 'none',
                  }}>
                    {Number(srv.totalPrice || 0)
                      .toLocaleString('ar-IQ')} د.ع
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── TOTALS (Rounded Wrapper) ── */}
        <table className="no-break" style={{
          width:          '100%',
          borderCollapse: 'collapse',
          marginBottom:   '10pt',
        }}>
          <tbody>
            <tr>
              <td style={{ width: '58%' }} />
              <td style={{ width: '42%' }}>
                <div style={{
                  border: '0.5pt solid #E2E8F0',
                  borderRadius: '12pt', /* Curved corners */
                  overflow: 'hidden',
                }}>
                  <table style={{
                    width:          '100%',
                    borderCollapse: 'collapse',
                    fontSize:       '9pt',
                  }}>
                    <tbody>
                      <tr>
                        <td style={{ padding:'5pt 10pt',
                                     color:'#64748B',
                                     borderBottom: '0.5pt solid #E2E8F0' }}>
                          المجموع الجزئي
                        </td>
                        <td style={{ padding:'5pt 10pt',
                                     textAlign:'left',
                                     fontWeight:'600',
                                     borderBottom: '0.5pt solid #E2E8F0' }}>
                          {fmt(subtotal)}
                        </td>
                      </tr>
                      {discount > 0 && (
                        <tr>
                          <td style={{ padding:'5pt 10pt',
                                       color:'#64748B',
                                       borderBottom: '0.5pt solid #E2E8F0' }}>
                            الخصم
                          </td>
                          <td style={{ padding:'5pt 10pt',
                                       textAlign:'left',
                                       color:'#16A34A',
                                       fontWeight:'600',
                                       borderBottom: '0.5pt solid #E2E8F0' }}>
                            − {fmt(discount)}
                          </td>
                        </tr>
                      )}
                      {tax > 0 && (
                        <tr>
                          <td style={{ padding:'5pt 10pt',
                                       color:'#64748B',
                                       borderBottom: '0.5pt solid #E2E8F0' }}>
                            ضريبة ({invoice?.taxRate || visit?.taxRate || 0}٪)
                          </td>
                          <td style={{ padding:'5pt 10pt',
                                       textAlign:'left',
                                       fontWeight:'600',
                                       borderBottom: '0.5pt solid #E2E8F0' }}>
                            {fmt(tax)}
                          </td>
                        </tr>
                      )}
                      <tr style={{ background: BG }}>
                        <td style={{
                          padding:    '7pt 10pt',
                          color:      FG,
                          fontWeight: '700',
                          fontSize:   '10.5pt',
                        }}>
                          الإجمالي
                        </td>
                        <td style={{
                          padding:    '7pt 10pt',
                          color:      ACCENT,
                          fontWeight: '700',
                          fontSize:   '12pt',
                          textAlign:  'left',
                        }}>
                          {fmt(total)}
                        </td>
                      </tr>
                      {paid > 0 && (
                        <tr>
                          <td style={{ padding:'5pt 10pt',
                                       color:'#16A34A',
                                       borderTop: '0.5pt solid #E2E8F0' }}>
                            المبلغ المدفوع
                          </td>
                          <td style={{ padding:'5pt 10pt',
                                       textAlign:'left',
                                       color:'#16A34A',
                                       fontWeight:'700',
                                       borderTop: '0.5pt solid #E2E8F0' }}>
                            {fmt(paid)}
                          </td>
                        </tr>
                      )}
                      {remaining > 0 && (
                        <tr>
                          <td style={{ padding:'5pt 10pt',
                                       color:'#DC2626',
                                       borderTop: '0.5pt solid #E2E8F0' }}>
                            المبلغ المتبقي
                          </td>
                          <td style={{ padding:'5pt 10pt',
                                       textAlign:'left',
                                       color:'#DC2626',
                                       fontWeight:'700',
                                       borderTop: '0.5pt solid #E2E8F0' }}>
                            {fmt(remaining)}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* ── PAYMENT STATUS STRIP (Rounded) ── */}
        <div className="no-break" style={{
          background:
            (invoice?.paymentStatus || visit?.paymentStatus) === 'paid'     ? '#F0FDF4' :
            (invoice?.paymentStatus || visit?.paymentStatus) === 'partial'  ? '#FFFBEB' :
            (invoice?.paymentStatus || visit?.paymentStatus) === 'deferred' ? '#EFF6FF' : '#FEF2F2',
          border: `0.5pt solid ${
            (invoice?.paymentStatus || visit?.paymentStatus) === 'paid'     ? '#86EFAC' :
            (invoice?.paymentStatus || visit?.paymentStatus) === 'partial'  ? '#FCD34D' :
            (invoice?.paymentStatus || visit?.paymentStatus) === 'deferred' ? '#93C5FD' : '#FECACA'}`,
          borderRadius: '10pt', /* Curved corners */
          padding:      '8pt 12pt',
          marginBottom: '10pt',
          fontSize:     '8.5pt',
        }}>
          {(invoice?.paymentStatus || visit?.paymentStatus) === 'paid'
            && `✅ مدفوع بالكامل [${paymentMethodStr}] — ${fmt(paid)}`}
          {(invoice?.paymentStatus || visit?.paymentStatus) === 'partial'
            && `🟡 دفع جزئي [${paymentMethodStr}] — مدفوع: ${fmt(paid)} | متبقي: ${fmt(remaining)}`}
          {(invoice?.paymentStatus || visit?.paymentStatus) === 'deferred'
            && `📋 آجل [${paymentMethodStr}] — إجمالي: ${fmt(total)}${invoice?.dueDate || visit?.dueDate ? ` | موعد: ${invoice?.dueDate || visit?.dueDate}` : ''}`}
          {(invoice?.paymentStatus || visit?.paymentStatus) === 'unpaid'
            && `🔴 غير مدفوع [${paymentMethodStr}] — الإجمالي: ${fmt(total)}`}
        </div>

        {/* ── NOTES ── */}
        {visit?.technicianNotes && (
          <div className="no-break" style={{
            borderRight:  `2.5pt solid ${ACCENT}`,
            borderRadius: '4pt',
            paddingRight: '8pt',
            marginBottom: '10pt',
            fontSize:     '8.5pt',
            color:        '#334155',
          }}>
            <strong>ملاحظات: </strong>
            {visit.technicianNotes}
          </div>
        )}

        {/* ── FOOTER ── */}
        <table className="no-break" style={{
          width:          '100%',
          borderCollapse: 'collapse',
          borderTop:      '0.5pt solid #E2E8F0',
          marginTop:      '12pt',
          paddingTop:     '10pt',
        }}>
          <tbody>
            <tr>
              <td style={{
                verticalAlign: 'bottom',
                paddingTop:    '10pt',
                fontSize:      '8.5pt',
                color:         '#64748B',
              }}>
                {FOOTER}
                {PHONE &&
                  <div style={{ marginTop:'3pt' }}>{PHONE}</div>}
              </td>
              <td style={{
                textAlign:     'left',
                verticalAlign: 'bottom',
                paddingTop:    '10pt',
              }}>
                <div style={{
                  display:        'inline-block',
                  width:          '52pt',
                  height:         '52pt',
                  borderRadius:   '50%',
                  border:         `1pt solid ${ACCENT}`,
                  textAlign:      'center',
                  lineHeight:     '52pt',
                  fontSize:       '7pt',
                  color:          ACCENT,
                  opacity:        0.5,
                }}>
                  ختم المركز
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* ── BOTTOM LINE ── */}
        <div style={{
          textAlign:  'center',
          fontSize:   '7pt',
          color:      '#94A3B8',
          marginTop:  '6pt',
          borderTop:  '0.5pt solid #E2E8F0',
          paddingTop: '6pt',
        }}>
          هذه الفاتورة وثيقة رسمية معتمدة
          {' • '}{invoice?.invoiceNumber || visit?.invoiceNumber || ''}
          {' • '}{NAME}
        </div>

      </div>
            </td>
          </tr>
        </tbody>
        <tfoot className="print-margin-spacer" style={{ display: 'none' }}>
          <tr>
            <td>
              <div style={{ height: '12mm' }}></div>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
