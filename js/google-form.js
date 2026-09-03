const GOOGLE_FORM = Object.freeze({
  responseUrl: 'https://docs.google.com/forms/d/e/1FAIpQLScyXa5vZ_uwykhBi2dzhLqGb8MrgJ0MDF6llfmc20G1RKruqw/formResponse',
  nameEntry: '305788652',
  ageEntry: '464989549',
  itemEntries: Object.freeze([
    '748915829','1320297790','1549841554','440296330','676729528','626359042','1708651113','1923562400','935472819','502581731',
    '1217958517','696158183','1152040360','1809768890','1126855798','1578993090','890927380','353875281','1677350885','1067326125',
    '1190034823','1133861202','549292860','1735407758','1392157173','676594854','900635586','680530602','1176101657','1935169199',
    '1769248518','1747580146','1553329151','1227061075','1391136770','17161041','2099792549','262871097','1839715259','1516963651',
    '1882799026','1428669394','401202277','1291683425','2034926789','1329993176','1297919101','2134845605','830033472','930368525',
    '1507389439','1691190620','852829506','1486061966','516995007','1632487223','1266437637','1649567331','2074101107','136777486'
  ])
});

function orderedItems(definition) {
  return definition.dimensions
    .flatMap(dimension => dimension.items)
    .slice()
    .sort((a, b) => Number(a.number) - Number(b.number));
}

export async function submitToGoogleForm(definition, responses, identity = {}) {
  const items = orderedItems(definition);
  if (items.length !== 60 || GOOGLE_FORM.itemEntries.length !== 60) {
    throw new Error('GOOGLE_FORM_MAP_INVALID');
  }

  const body = new URLSearchParams();
  body.set('fvv', '1');
  body.set('pageHistory', '0,1,2,3,4,5,6');
  body.set(`entry.${GOOGLE_FORM.nameEntry}`, String(identity.name || '').trim() || 'Não informado');

  const age = String(identity.age || '').trim();
  if (age) body.set(`entry.${GOOGLE_FORM.ageEntry}`, age);

  items.forEach((item, index) => {
    const value = Number(responses[item.id]);
    if (![1, 2, 3, 4, 5].includes(value)) {
      throw new Error(`GOOGLE_FORM_RESPONSE_INVALID:${item.id}`);
    }
    body.set(`entry.${GOOGLE_FORM.itemEntries[index]}`, String(value));
  });

  await fetch(GOOGLE_FORM.responseUrl, {
    method: 'POST',
    mode: 'no-cors',
    credentials: 'omit',
    cache: 'no-store',
    referrerPolicy: 'no-referrer',
    body
  });
}
