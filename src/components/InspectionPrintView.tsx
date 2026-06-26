import React from 'react';
import { useSettingsStore } from '../store/settingsStore';
import { VehicleInspection, InspectionItemStatus } from '../store/useInspectionStore';
import { Car, Customer } from '../store/customerStore';

interface InspectionPrintViewProps {
  id?: string;
  inspection: VehicleInspection;
  car: Car;
  customer: Customer | null;
}

export const InspectionPrintView: React.FC<InspectionPrintViewProps> = ({
  id = 'INVOICE_PRINT',
  inspection,
  car,
  customer,
}) => {
  const S    = useSettingsStore((s) => s.invoice) || {};
  const BG   = S.headerBgColor  || '#0F172A';
  const FG   = S.headerTextColor|| '#FFFFFF';
  const ACCENT = S.accentColor  || '#6366F1';
  const NAME = S.centerName     || 'مركز الخدمة';
  const LOGO = S.logoBase64     || null;
  const FONT = S.fontFamily     || 'Tajawal';
  const PHONE = S.phone         || '';
  const ADDR = S.address        || '';

  const allItems = (inspection.sections || []).flatMap(s => s.items || []);
  const good      = allItems.filter(i => i.status === 'good').length;
  const attention = allItems.filter(i => i.status === 'attention').length;
  const replace   = allItems.filter(i => i.status === 'replace').length;
  const total     = allItems.filter(i => i.status !== 'na').length;

  const overallConfig = {
    good:      { label: 'السيارة سليمة',       color: '#16A34A', bg: '#DCFCE7' },
    attention: { label: 'تحتاج متابعة ومراجعة', color: '#D97706', bg: '#FEF3C7' },
    poor:      { label: 'تحتاج إصلاح عاجل',     color: '#DC2626', bg: '#FEE2E2' },
  };
  const ov = overallConfig[inspection.overallStatus || 'good'] || overallConfig.good;

  // Filter out items that have issues (attention or replace)
  const issueItems = allItems.filter(i => i.status === 'attention' || i.status === 'replace');

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
                            alt="Logo"
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

                      {/* Report number */}
                      <td style={{
                        width:         '22%',
                        textAlign:     'left',
                        verticalAlign: 'middle',
                      }}>
                        <div style={{
                          color:     '#94A3B8',
                          fontSize:  '7.5pt',
                        }}>
                          رقم التقرير
                        </div>
                        <div style={{
                          color:      ACCENT,
                          fontSize:   '15pt',
                          fontWeight: '700',
                          lineHeight: '1.2',
                        }}>
                          {inspection.reportNumber}
                        </div>
                        <div style={{
                          color:     '#94A3B8',
                          fontSize:  '8pt',
                          marginTop: '3pt',
                        }}>
                          {inspection.date
                            ? new Date(inspection.date)
                                .toLocaleDateString('ar-IQ')
                            : ''}
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Stripe */}
              {S.showGradientStripe && (
                <div style={{
                  height: `${S.stripeHeight || 3}px`,
                  background: `linear-gradient(to left, ${S.gradientColor1 || '#6366F1'}, ${S.gradientColor2 || '#06B6D4'})`,
                  marginBottom: '12pt',
                  borderRadius: '99px',
                }} />
              )}

              {/* ══ BODY ══ */}
              <div style={{ padding: '0' }}>

                {/* ── CUSTOMER + INSPECTION INFO (Rounded Table Wrapper) ── */}
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
                            بيانات الفحص الفني
                          </div>
                          <table style={{ borderCollapse:'collapse' }}>
                            <tbody>
                              {[
                                ['تاريخ الفحص',
                                  inspection?.date
                                    ? new Date(inspection.date)
                                        .toLocaleDateString('ar-IQ')
                                    : '—'],
                                ['الفاحص المسؤول', inspection?.inspectorName || '—'],
                                ['قراءة العداد',
                                  inspection?.odometer
                                    ? inspection.odometer.toLocaleString('ar-IQ') + ' كم'
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

                {/* ── CAR INFO (Rounded Table Wrapper) ── */}
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
                            { l:'السيارة',  v:`${car.brand||''} ${car.name||''}` },
                            { l:'السنة',    v: car.year        || '—' },
                            { l:'اللون',    v: car.color       || '—' },
                            { l:'اللوحة',   v: car.plateNumber || '—' },
                            { l:'الشاصي',   v: car.chassisNumber || '—' },
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

                {/* ─── OVERALL SCORE CARD ─── */}
                <div className="no-break" style={{
                  background: '#F8FAFC',
                  border: '0.5pt solid #E2E8F0',
                  borderRadius: '12pt',
                  padding: '12pt',
                  marginBottom: '14pt',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontSize: '9pt', color: '#64748B', marginBottom: '3pt' }}>النتيجة الإجمالية للفحص الشامل:</div>
                    <span style={{
                      background: ov.bg,
                      color: ov.color,
                      padding: '4pt 12pt',
                      borderRadius: '20px',
                      fontSize: '11pt',
                      fontWeight: '800',
                      border: `1px solid ${ov.color}30`,
                      display: 'inline-block'
                    }}>
                      {inspection.overallStatus === 'good' ? '✅' : inspection.overallStatus === 'attention' ? '⚠️' : '🔴'} {ov.label}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '15pt', textAlign: 'center' }}>
                    <div style={{ borderRight: '2.5px solid #16A34A', paddingRight: '10pt' }}>
                      <div style={{ fontSize: '14pt', fontWeight: '800', color: '#16A34A' }}>{good}</div>
                      <div style={{ fontSize: '8pt', color: '#64748B' }}>سليم</div>
                    </div>
                    <div style={{ borderRight: '2.5px solid #D97706', paddingRight: '10pt' }}>
                      <div style={{ fontSize: '14pt', fontWeight: '800', color: '#D97706' }}>{attention}</div>
                      <div style={{ fontSize: '8pt', color: '#64748B' }}>متابعة</div>
                    </div>
                    <div style={{ borderRight: '2.5px solid #DC2626', paddingRight: '10pt' }}>
                      <div style={{ fontSize: '14pt', fontWeight: '800', color: '#DC2626' }}>{replace}</div>
                      <div style={{ fontSize: '8pt', color: '#64748B' }}>استبدال</div>
                    </div>
                    <div style={{ borderRight: '2.5px solid #94A3B8', paddingRight: '10pt', paddingLeft: '5pt' }}>
                      <div style={{ fontSize: '14pt', fontWeight: '800', color: '#475569' }}>{total}</div>
                      <div style={{ fontSize: '8pt', color: '#64748B' }}>إجمالي المفحوص</div>
                    </div>
                  </div>
                </div>

                {/* ─── DETECTED ISSUES TABLE (Rounded Wrapper) ─── */}
                {issueItems.length > 0 && (
                  <div className="no-break rounded-wrapper" style={{
                    border: '0.5pt solid #E2E8F0',
                    borderRadius: '12pt',
                    overflow: 'hidden',
                    marginBottom: '14pt',
                  }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8.5pt' }}>
                      <thead>
                        <tr style={{ background: BG }}>
                          {['القسم', 'البند / الأنظمة الفنية', 'الحالة المكتشفة', 'الملاحظات والتوصية'].map((h, i) => (
                            <th key={i} style={{
                              padding: '8pt 10pt',
                              textAlign: 'right',
                              color: FG,
                              fontWeight: '600',
                              fontSize: '8.5pt',
                              border: 'none',
                            }}>
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {issueItems.map((item, idx) => {
                          const sec = (inspection.sections || []).find(s => (s.items || []).some(i => i.id === item.id));
                          return (
                            <tr
                              key={item.id}
                              style={{
                                background: idx % 2 === 0 ? '#ffffff' : '#F8FAFC',
                                borderBottom: idx < issueItems.length - 1 ? '0.5pt solid #E2E8F0' : 'none',
                                pageBreakInside: 'avoid',
                              }}
                            >
                              <td style={{ padding: '6pt 10pt', fontWeight: '600' }}>
                                {sec?.name || '—'}
                              </td>
                              <td style={{ padding: '6pt 10pt' }}>
                                <div style={{ fontWeight: '600' }}>{item.name}</div>
                                <div style={{ fontSize: '7.5pt', color: '#64748B', fontFamily: 'monospace' }}>{item.nameEn}</div>
                              </td>
                              <td style={{ padding: '6pt 10pt', fontWeight: '700' }}>
                                <span style={{
                                  color: item.status === 'replace' ? '#DC2626' : '#D97706',
                                  background: item.status === 'replace' ? '#FEE2E2' : '#FEF3C7',
                                  padding: '1.5pt 5pt', borderRadius: '4px', fontSize: '8pt',
                                  border: `1px solid ${item.status === 'replace' ? '#FCA5A5' : '#FDE68A'}`,
                                  display: 'inline-block',
                                }}>
                                  {item.status === 'replace' ? '✕ استبدال' : '⚠ متابعة'}
                                </span>
                              </td>
                              <td style={{ padding: '6pt 10pt', color: '#334155' }}>
                                {item.notes || 'لا توجد ملاحظات إضافية'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* ─── SUMMARY GRID OF ALL SECTIONS ─── */}
                <div style={{ marginBottom: '14pt' }}>
                  <div style={{ fontWeight: '700', fontSize: '10pt', color: ACCENT, marginBottom: '8pt' }}>
                    📋 ملخص فحص كافة الأنظمة والبنود
                  </div>
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '8pt',
                    width: '100%',
                  }}>
                    {(inspection.sections || []).map((sec) => {
                      return (
                        <div
                          key={sec.id}
                          className="no-break"
                          style={{
                            border: '0.5pt solid #E2E8F0',
                            borderRadius: '10pt',
                            padding: '8pt 10pt',
                            background: '#FFFFFF',
                            width: 'calc(50% - 4pt)',
                            boxSizing: 'border-box',
                          }}
                        >
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '6pt',
                            borderBottom: `1.5pt solid ${sec.color || ACCENT}`,
                            paddingBottom: '3pt',
                          }}>
                            <span style={{ fontWeight: '700', color: sec.color || ACCENT, fontSize: '9pt' }}>{sec.name}</span>
                            <span style={{ fontSize: '7.5pt', color: '#64748B' }}>
                              {(sec.items || []).filter(i => i.status !== 'na').length} مفحوص
                            </span>
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4pt', fontSize: '7.5pt' }}>
                            {(sec.items || []).map(item => {
                              const stSymbol = item.status === 'good' ? '✓' : item.status === 'attention' ? '⚠' : item.status === 'replace' ? '✕' : '-';
                              const stColor = item.status === 'good' ? '#16A34A' : item.status === 'attention' ? '#D97706' : item.status === 'replace' ? '#DC2626' : '#94A3B8';
                              return (
                                <div key={item.id} style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '2px',
                                  padding: '2px 5pt',
                                  border: '1px solid #F1F5F9',
                                  borderRadius: '5px',
                                  background: '#F8FAFC'
                                }}>
                                  <span style={{ color: stColor, fontWeight: '900' }}>{stSymbol}</span>
                                  <span style={{ color: '#475569', fontSize: '7.5pt' }}>{item.name}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* ─── RECOMMENDATIONS & NEXT INSPECTION ─── */}
                <div className="no-break" style={{
                  display: 'grid',
                  gridTemplateColumns: '1.5fr 1fr',
                  gap: '12pt',
                  marginBottom: '20pt'
                }}>
                  {/* Recommendations / Notes */}
                  <div style={{ border: '0.5pt solid #E2E8F0', borderRadius: '12pt', padding: '10pt', background: '#FFFFFF' }}>
                    <div style={{ fontWeight: '700', fontSize: '9pt', color: '#475569', marginBottom: '4pt' }}>📝 التوصيات الفنية العامة للفاحص:</div>
                    <div style={{ fontSize: '8.5pt', color: '#334155', lineHeight: '1.4', minHeight: '40pt', whiteSpace: 'pre-wrap' }}>
                      {inspection.recommendations || 'لا توجد توصيات عامة إضافية. السيارة بحالة جيدة عموماً.'}
                    </div>
                  </div>

                  {/* Next inspection */}
                  <div style={{ border: '0.5pt solid #E2E8F0', borderRadius: '12pt', padding: '10pt', background: '#FFFFFF' }}>
                    <div style={{ fontWeight: '700', fontSize: '9pt', color: '#475569', marginBottom: '4pt' }}>📅 موعد الفحص الدوري القادم:</div>
                    <table style={{ width: '100%', fontSize: '8.5pt' }}>
                      <tbody>
                        {inspection.nextInspectionKm > 0 && (
                          <tr>
                            <td style={{ color: '#64748B', padding: '3pt 0' }}>عند عداد مسافة:</td>
                            <td style={{ fontWeight: '700', padding: '3pt 0' }}>{inspection.nextInspectionKm.toLocaleString('ar-IQ')} كم</td>
                          </tr>
                        )}
                        {inspection.nextInspectionDate && (
                          <tr>
                            <td style={{ color: '#64748B', padding: '3pt 0' }}>تاريخ الاستحقاق:</td>
                            <td style={{ fontWeight: '700', padding: '3pt 0' }}>
                              {new Date(inspection.nextInspectionDate).toLocaleDateString('ar-IQ')}
                            </td>
                          </tr>
                        )}
                        {!inspection.nextInspectionKm && !inspection.nextInspectionDate && (
                          <tr>
                            <td colSpan={2} style={{ color: '#64748B', fontStyle: 'italic', padding: '5pt 0' }}>
                              لم يحدد موعد فحص قادم.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* ─── FOOTER SIGNATURES ─── */}
                <div className="no-break" style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '20pt',
                  borderTop: '0.5pt solid #E2E8F0',
                  paddingTop: '15pt'
                }}>
                  <div style={{ width: '35%', textAlign: 'center' }}>
                    <div style={{ fontSize: '8.5pt', color: '#64748B', marginBottom: '25pt' }}>توقيع الفاحص المسؤول</div>
                    <div style={{ borderBottom: '1px dashed #94A3B8', width: '80%', margin: '0 auto', marginBottom: '4pt' }}></div>
                    <div style={{ fontSize: '8.0pt', fontWeight: '700' }}>
                      {inspection.inspectorName || 'فاحص المركز المعني'}
                    </div>
                  </div>

                  <div style={{ width: '30%', textAlign: 'center' }}>
                    <div style={{ fontSize: '8pt', color: '#94A3B8' }}>
                      {S.footerText || 'شكراً لثقتكم بمركزنا — نتمنى لكم قيادة آمنة'}
                    </div>
                    {/* Center seal circle */}
                    <div style={{
                      display: 'inline-block',
                      width: '52pt',
                      height: '52pt',
                      borderRadius: '50%',
                      border: `1pt solid ${ACCENT}`,
                      textAlign: 'center',
                      lineHeight: '52pt',
                      fontSize: '7pt',
                      color: ACCENT,
                      opacity: 0.5,
                      marginTop: '10pt',
                    }}>
                      ختم المركز
                    </div>
                  </div>

                  <div style={{ width: '35%', textAlign: 'center' }}>
                    <div style={{ fontSize: '8.5pt', color: '#64748B', marginBottom: '25pt' }}>توقيع واستلام العميل</div>
                    <div style={{ borderBottom: '1px dashed #94A3B8', width: '80%', margin: '0 auto', marginBottom: '4pt' }}></div>
                    <div style={{ fontSize: '8.0pt', fontWeight: '700' }}>{customer?.name || 'غير متوفر'}</div>
                  </div>
                </div>

                {/* ── BOTTOM LINE ── */}
                <div style={{
                  textAlign:  'center',
                  fontSize:   '7pt',
                  color:      '#94A3B8',
                  marginTop:  '15pt',
                  borderTop:  '0.5pt solid #E2E8F0',
                  paddingTop: '6pt',
                }}>
                  هذا التقرير وثيقة فحص رسمية معتمدة
                  {' • '}{inspection.reportNumber || ''}
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
};
