import {
  encode,
  decode,
  isValid,
  formatDigipin,
  isWithinIndiaBounds,
} from './engine';

// Helper to compute distance between two lat/lng in meters
function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function runTests() {
  console.log('--- Starting DIGIPIN Engine Verification Tests ---');

  // 1. Mandatory Baseline Test against official standard
  console.log('\n--- 1. Baseline Specific Coordinate Test ---');
  const baselineLat = 28.508829;
  const baselineLng = 77.234338;
  const baselineCode = encode(baselineLat, baselineLng);
  console.log(`✓ Baseline [${baselineLat}, ${baselineLng}] => ${baselineCode}`);

  if (baselineCode !== '39J-M99-P923') {
    throw new Error(`Baseline test FAILED: Expected '39J-M99-P923', got '${baselineCode}'`);
  }

  // 2. Decode Baseline and verify roundtrip precision
  const decodedBaseline = decode(baselineCode);
  const baselineError = haversineMeters(
    baselineLat,
    baselineLng,
    decodedBaseline.center.lat,
    decodedBaseline.center.lng
  );
  console.log(
    `✓ Decoded Baseline Center: [${decodedBaseline.center.lat}, ${decodedBaseline.center.lng}] (Error: ${baselineError.toFixed(2)}m)`
  );
  if (baselineError > 3.0) {
    throw new Error(`Baseline roundtrip error exceeded 3m: ${baselineError.toFixed(2)}m`);
  }

  // 3. Metropolitan Anchor Cities Verification
  console.log('\n--- 2. Metropolitan Anchors Verification ---');
  const testCities = [
    { name: 'New Delhi (India Gate)', lat: 28.6129, lng: 77.2295 },
    { name: 'Mumbai (Gateway of India)', lat: 18.9220, lng: 72.8347 },
    { name: 'Bengaluru (Vidhana Soudha)', lat: 12.9797, lng: 77.5907 },
    { name: 'Kolkata (Victoria Memorial)', lat: 22.5448, lng: 88.3426 },
    { name: 'Leh (Ladakh)', lat: 34.1526, lng: 77.5771 },
    { name: 'Kanyakumari (Tamil Nadu)', lat: 8.0883, lng: 77.5385 },
  ];

  for (const city of testCities) {
    const t0 = performance.now();
    const code = encode(city.lat, city.lng);
    const encodeTime = performance.now() - t0;

    if (!isValid(code)) {
      throw new Error(`Invalid code generated for ${city.name}: ${code}`);
    }

    const t1 = performance.now();
    const decoded = decode(code);
    const decodeTime = performance.now() - t1;

    const errorDistance = haversineMeters(
      city.lat,
      city.lng,
      decoded.center.lat,
      decoded.center.lng
    );

    console.log(
      `✓ ${city.name}: ${code} (Error: ${errorDistance.toFixed(
        2
      )}m, Encode: ${encodeTime.toFixed(3)}ms, Decode: ${decodeTime.toFixed(3)}ms)`
    );

    if (errorDistance > 5.5) {
      throw new Error(
        `Roundtrip error too high for ${city.name}: ${errorDistance.toFixed(2)}m (expected < 5.5m)`
      );
    }
  }

  // 4. Test Out-of-Bounds Rejection
  console.log('\n--- 3. Out-of-Bounds Rejection ---');
  const outOfBounds = [
    { name: 'London', lat: 51.5074, lng: -0.1278 },
    { name: 'New York', lat: 40.7128, lng: -74.0060 },
    { name: 'Tokyo', lat: 35.6762, lng: 139.6503 },
    { name: 'Indian Ocean South', lat: 1.0, lng: 77.0 },
    { name: 'Tibet North', lat: 39.0, lng: 80.0 },
  ];

  for (const loc of outOfBounds) {
    const within = isWithinIndiaBounds(loc.lat, loc.lng);
    if (within) {
      throw new Error(`Expected ${loc.name} to be out of bounds, but got true.`);
    }

    let threw = false;
    try {
      encode(loc.lat, loc.lng);
    } catch {
      threw = true;
    }

    if (!threw) {
      throw new Error(`Expected encode(${loc.lat}, ${loc.lng}) for ${loc.name} to throw an error.`);
    }
    console.log(`✓ Correctly rejected out-of-bounds location: ${loc.name}`);
  }

  // 5. Test Format Masking & Validation
  console.log('\n--- 4. Format Masking & Validation ---');
  if (!isValid('39J-M99-P923')) {
    throw new Error("Valid formatted code '39J-M99-P923' failed isValid() check");
  }
  if (!isValid('39JM99P923')) {
    throw new Error("Valid unformatted code '39JM99P923' failed isValid() check");
  }
  if (isValid('2345678901')) {
    throw new Error('Code with 0 and 1 passed isValid() check when it should fail');
  }
  if (isValid('2345')) {
    throw new Error('Short code passed isValid() check');
  }

  const formatted = formatDigipin('39JM99P923');
  if (formatted !== '39J-M99-P923') {
    throw new Error(`Format error: expected '39J-M99-P923', got '${formatted}'`);
  }
  console.log(`✓ Official 3-3-4 formatting verified: ${formatted}`);

  // 6. Stress Performance Test (1,000 continuous operations)
  console.log('\n--- 5. Performance Benchmark (1,000 Operations) ---');
  const tStart = performance.now();
  for (let i = 0; i < 1000; i++) {
    const lat = 28.0 + (i % 50) * 0.1;
    const lng = 75.0 + (i % 50) * 0.1;
    const c = encode(lat, lng);
    decode(c);
  }
  const totalElapsed = performance.now() - tStart;
  const avgPerOp = totalElapsed / 1000;
  console.log(
    `✓ 1,000 Encode+Decode operations completed in ${totalElapsed.toFixed(2)}ms (${avgPerOp.toFixed(
      4
    )}ms per cycle)`
  );

  if (avgPerOp > 0.5) {
    throw new Error(`Performance exceeded 0.5ms threshold: ${avgPerOp.toFixed(4)}ms`);
  }

  console.log('\n=== ALL DIGIPIN ENGINE TESTS PASSED SUCCESSFULLY ===');
}

runTests();
