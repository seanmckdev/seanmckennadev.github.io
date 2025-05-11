// Aircraft data: Indexed by tail number
const aircraftData = {
    N138ME: { weight: 1647.2, arm: 40.25, moment: 66299.8, model: 'S' },
    N211TD: { weight: 1667.5, arm: 39.4483, moment: 65780.12, model: 'S' },
    N2477F: { weight: 1720.6, arm: 41.76, moment: 71850.5, model: 'S' },
    N427EP: { weight: 1657.42, arm: 39.36, moment: 65239.62, model: 'S' },
    N664CA: { weight: 1753.37, arm: 41.63756, moment: 73006.06, model: 'R' },
    N9501F: { weight: 1667.4, arm: 39.11, moment: 65212.48, model: 'R' },
    N98436: { weight: 1661.8, arm: 39.1604, moment: 65076.74, model: 'R' },
};

let isRModel = true;

document.addEventListener('DOMContentLoaded', () => {
    const numberInputs = document.querySelectorAll('.number-input');
    const aircraftSelector = document.getElementById('inlineFormCustomSelect');
    const basicEmptyWeightInput = document.getElementById('basicEmptyWeightInput');
    const armInput = document.getElementById('armInput');
    const momentInput = document.getElementById('momentInput');
    const tailNumberElement = document.getElementById('tailNumber');
    const calculateButton = document.getElementById('calculateWB');
    const rModelRadio = document.getElementById('rModelSel');
    const sModelRadio = document.getElementById('sModelSel');

    // Function to validate the input value
    function validateInput(event) {
        const input = event.target;
        const value = input.value;

        if (isNaN(value) || value.trim() === '') {
            input.value = '';
        }
    }

    // Add event listeners to all number inputs
    numberInputs.forEach((input) => {
        input.addEventListener('blur', validateInput);
        input.addEventListener('change', validateInput);
    });

    // Update the inputs and tail number based on the selected aircraft
    aircraftSelector.addEventListener('change', () => {
        const selectedTailNumber = aircraftSelector.value;

        if (aircraftData[selectedTailNumber]) {
            tailNumberElement.textContent = selectedTailNumber;

            // Update the inputs with the selected aircraft's data
            const { weight, arm, moment, model } = aircraftData[selectedTailNumber];
            basicEmptyWeightInput.value = weight;
            armInput.value = arm;
            momentInput.value = moment;

            // Update the radio buttons and isRModel based on the model
            if (model === 'R') {
                isRModel = true;
                rModelRadio.checked = true;
            } else if (model === 'S') {
                isRModel = false;
                sModelRadio.checked = true;
            }

            //console.log(`Selected aircraft: ${selectedTailNumber}, Model: ${model}, isRModel: ${isRModel}`);
        } else {
            // Reset inputs and set tail number to "N ????"
            tailNumberElement.textContent = 'N?????';
            basicEmptyWeightInput.value = '';
            armInput.value = '';
            momentInput.value = '';
        }
    });

    rModelRadio.addEventListener('change', () => {
        if (rModelRadio.checked) {
            isRModel = true;
            //console.log('R Model selected:', isRModel); // Debugging log
        }
    });

    sModelRadio.addEventListener('change', () => {
        if (sModelRadio.checked) {
            isRModel = false;
            //console.log('S Model selected:', isRModel); // Debugging log
        }
    });

    calculateButton.addEventListener('click', calculateWB);

    
    function calculateWB() {
    // Helper function to format numbers
    function formatNumber(value) {
        return Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    // B.E.W.
    const bew = Number(document.getElementById('basicEmptyWeightInput').value);
    const arm = Number(document.getElementById('armInput').value);
    const moment = Number(document.getElementById('momentInput').value);

    document.getElementById('weight-basic-empty-weight').textContent = formatNumber(bew || 0);
    document.getElementById('arm-basic-empty-weight').textContent = formatNumber(arm || 0);
    document.getElementById('moment-basic-empty-weight').textContent = formatNumber(moment || 0);

    // Front seats
    const frontRowSeats = Number(document.getElementById('leftFrontInput').value) + Number(document.getElementById('rightFrontInput').value);
    const frontRowSeatsArm = 37;
    const frontRowSeatsMoment = frontRowSeats * frontRowSeatsArm;

    document.getElementById('weight-front-seats').textContent = formatNumber(frontRowSeats || 0);
    document.getElementById('arm-front-seats').textContent = formatNumber(frontRowSeatsArm || 0);
    document.getElementById('moment-front-seats').textContent = formatNumber(frontRowSeatsMoment || 0);

    // Rear seats
    const backRowSeats = Number(document.getElementById('leftBackInput').value) + Number(document.getElementById('rightBackInput').value);
    const backRowSeatsArm = 73;
    const backRowSeatsMoment = backRowSeats * backRowSeatsArm;

    document.getElementById('weight-rear-seats').textContent = formatNumber(backRowSeats || 0);
    document.getElementById('arm-rear-seats').textContent = formatNumber(backRowSeatsArm || 0);
    document.getElementById('moment-rear-seats').textContent = formatNumber(backRowSeatsMoment || 0);

    // Forward baggage
    const forwardBaggage = Number(document.getElementById('forwardBaggageInput').value);
    const forwardBaggageArm = 95;
    const forwardBaggageMoment = forwardBaggage * forwardBaggageArm;

    document.getElementById('weight-forward-baggage').textContent = formatNumber(forwardBaggage || 0);
    document.getElementById('arm-forward-baggage').textContent = formatNumber(forwardBaggageArm || 0);
    document.getElementById('moment-forward-baggage').textContent = formatNumber(forwardBaggageMoment || 0);

    // Aft baggage
    const aftBaggage = Number(document.getElementById('aftBaggageInput').value);
    const aftBaggageArm = 123;
    const aftBaggageMoment = aftBaggage * aftBaggageArm;

    document.getElementById('weight-aft-baggage').textContent = formatNumber(aftBaggage || 0);
    document.getElementById('arm-aft-baggage').textContent = formatNumber(aftBaggageArm || 0);
    document.getElementById('moment-aft-baggage').textContent = formatNumber(aftBaggageMoment || 0);

    // Zero fuel weight
    const zeroFuelWeight = bew + frontRowSeats + backRowSeats + forwardBaggage + aftBaggage;
    const zeroFuelMoment = moment + frontRowSeatsMoment + backRowSeatsMoment + forwardBaggageMoment + aftBaggageMoment;
    const zeroFuelArm = zeroFuelMoment / zeroFuelWeight;

    document.getElementById('weight-zero-fuel-weight').textContent = formatNumber(zeroFuelWeight || 0);
    document.getElementById('arm-zero-fuel-weight').textContent = formatNumber(zeroFuelArm || 0);
    document.getElementById('moment-zero-fuel-weight').textContent = formatNumber(zeroFuelMoment || 0);

    // Main fuel
    const mainFuel = Number(document.getElementById('mainFuelInput').value) * 6;
    const mainFuelArm = 48;
    const mainFuelMoment = mainFuel * mainFuelArm;

    document.getElementById('weight-main-fuel').textContent = formatNumber(mainFuel || 0);
    document.getElementById('arm-main-fuel').textContent = formatNumber(mainFuelArm || 0);
    document.getElementById('moment-main-fuel').textContent = formatNumber(mainFuelMoment || 0);

    // Ramp weight
    const rampWeight = zeroFuelWeight + mainFuel;
    const rampMoment = zeroFuelMoment + mainFuelMoment;
    const rampArm = rampMoment / rampWeight;

    document.getElementById('weight-ramp-weight').textContent = formatNumber(rampWeight || 0);
    document.getElementById('arm-ramp-weight').textContent = formatNumber(rampArm || 0);
    document.getElementById('moment-ramp-weight').textContent = formatNumber(rampMoment || 0);

    // Fuel burn runup/taxi
    const runup = Number(document.getElementById('fuelBurnRunupInput').value) * 6 * -1;
    const runupMoment = runup * mainFuelArm;

    document.getElementById('weight-fuel-run-up').textContent = formatNumber(runup || 0);
    document.getElementById('arm-fuel-run-up').textContent = formatNumber(mainFuelArm || 0);
    document.getElementById('moment-fuel-run-up').textContent = formatNumber(runupMoment || 0);

    // Takeoff weight
    const takeoffWeight = rampWeight + runup;
    const takeoffMoment = rampMoment + runupMoment;
    const takeoffArm = takeoffMoment / takeoffWeight;

    document.getElementById('weight-takeoff-weight').textContent = formatNumber(takeoffWeight || 0);
    document.getElementById('arm-takeoff-weight').textContent = formatNumber(takeoffArm || 0);
    document.getElementById('moment-takeoff-weight').textContent = formatNumber(takeoffMoment || 0);

    // Fuel burn in flight
    const fuelBurn = Number(document.getElementById('fuelBurnInput').value) * 6 * -1;
    const fuelBurnMoment = fuelBurn * mainFuelArm;

    document.getElementById('weight-fuel-burn').textContent = formatNumber(fuelBurn || 0);
    document.getElementById('arm-fuel-burn').textContent = formatNumber(mainFuelArm || 0);
    document.getElementById('moment-fuel-burn').textContent = formatNumber(fuelBurnMoment || 0);

    // Landing Weight
    const landingWeight = takeoffWeight + fuelBurn;
    const landingMoment = takeoffMoment + fuelBurnMoment;
    const landingArm = landingMoment / landingWeight;

    document.getElementById('weight-landing-weight').textContent = formatNumber(landingWeight || 0);
    document.getElementById('arm-landing-weight').textContent = formatNumber(landingArm || 0);
    document.getElementById('moment-landing-weight').textContent = formatNumber(landingMoment || 0);

    // Update Va speeds
    updateVaSpeeds(takeoffWeight, landingWeight);
}

function updateVaSpeeds(takeoffWeight, landingWeight) {
    // Helper function to calculate Va
    function calculateVa(maxVa, maxWeight, currentWeight) {
        return maxVa * Math.sqrt(currentWeight / maxWeight);
    }
    const maxWeight = isRModel ? 2450 : 2550;
    const maxVa = isRModel ? 99 : 105;
    
    const vaTakeoff = calculateVa(maxVa, maxWeight, takeoffWeight);
    const vaLanding = calculateVa(maxVa, maxWeight, landingWeight);

    document.getElementById('va-takeoff').textContent = vaTakeoff.toFixed(2);
    document.getElementById('va-landing').textContent = vaLanding.toFixed(2);
}
});