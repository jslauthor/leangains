// @flow
import type {
  QueryState,
  GenderType,
  MassType,
  Macros
} from "../utils/StateUtils";

import * as React from "react";
import styled from "styled-components";
import {
  getStateFromQuery,
  stateToQueryString,
  defaultMacros,
  getDefaultCaloricAdjustments
} from "../utils/StateUtils";

import MacrosPanel from "./MacrosPanel";
import { CheckBox, CheckBoxOutlineBlank, Favorite } from "@material-ui/icons";
import TextField from "@material-ui/core/TextField";
import MenuItem from "@material-ui/core/MenuItem";
import Typography from "@material-ui/core/Typography";
import Radio from "@material-ui/core/Radio";
import RadioGroup from "@material-ui/core/RadioGroup";
import Paper from "@material-ui/core/Paper";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Divider from "@material-ui/core/Divider";
import Tooltip from "@material-ui/core/Tooltip";
import InfoIcon from "@material-ui/icons/Info";

// import grey from "@material-ui/core/colors/grey";

const CM_MULTIPLE = 2.54;
const KG_MULTIPLE = 2.2;

/**
 * Actions
 */

type Action =
  | { type: "STANDARD_CHANGED", payload: boolean }
  | { type: "GENDER_CHANGED", payload: GenderType }
  | { type: "NAME_CHANGED", payload: string }
  | { type: "WEIGHT_CHANGED", payload: number }
  | { type: "AGE_CHANGED", payload: number }
  | { type: "HEIGHT_CHANGED", payload: number }
  | { type: "BODY_FAT_CHANGED", payload: number }
  | { type: "MUSCLE_MASS_CHANGED", payload: MassType }
  | { type: "STEPS_PER_DAY_CHANGED", payload: number }
  | {
      type: "MACRO_PERCENT_CHANGED",
      payload: { index: number, macroPercent: Macros }
    }
  | {
      type: "KCAL_ADJUSTMENT_CHANGED",
      payload: { index: number, kcalAdjustment: number }
    }
  | {
      type: "MULTIPLIER_CHANGED",
      payload: { index: number, multiplier: number, isRest: boolean }
    };

const standardChanged = (metric: number) => ({
  type: "STANDARD_CHANGED",
  payload: metric === 0 ? false : true
});

const genderChanged = (gender: string) => ({
  type: "GENDER_CHANGED",
  payload: gender
});

const nameChanged = (name: string) => ({
  type: "NAME_CHANGED",
  payload: name
});

const weightChanged = (metric: boolean, weight: number) => ({
  type: "WEIGHT_CHANGED",
  payload: metric ? weight : weight / KG_MULTIPLE
});

const ageChanged = (age: number) => ({
  type: "AGE_CHANGED",
  payload: age
});

const heightChanged = (metric: boolean, height: number) => ({
  type: "HEIGHT_CHANGED",
  payload: metric ? height : height * CM_MULTIPLE
});

const bodyFatChanged = (bodyFatPercentage: number) => ({
  type: "BODY_FAT_CHANGED",
  payload: bodyFatPercentage
});

const muscleMassChanged = (muscleMass: MassType) => ({
  type: "MUSCLE_MASS_CHANGED",
  payload: muscleMass
});

const stepsPerDayChanged = (steps: number) => ({
  type: "STEPS_PER_DAY_CHANGED",
  payload: steps
});

const macroPercentChanged = (index: number) => (macroPercent: Macros) => ({
  type: "MACRO_PERCENT_CHANGED",
  payload: { index, macroPercent }
});

const kcalAdjustmentChanged = (index: number) => (kcalAdjustment: number) => ({
  type: "KCAL_ADJUSTMENT_CHANGED",
  payload: { index, kcalAdjustment }
});

const multiplierChanged = (index: number) => (isRest: boolean) => (
  multiplier: number
) => ({
  type: "MULTIPLIER_CHANGED",
  payload: { index, multiplier, isRest }
});

/**
 * Create Context provider and reducer which stores the state in query variables.
 * Yes, this is a side effect, but it is the data structure I want to use as the source of truth
 * to enable easy link sharing.
 */

const Context: Object = React.createContext();
const saveQueryParams = (state: QueryState) => {
  // Save base64 encoded string to url for easy copy/paste
  window.location.href = `${
    window.location.href.split("#")[0]
  }#data=${stateToQueryString(state)}`;
};

const reducer: (QueryState, Action) => QueryState = (
  state: QueryState,
  action: Action
) => {
  switch (action.type) {
    case "STANDARD_CHANGED":
      return { ...state, metric: action.payload };
    case "GENDER_CHANGED":
      return { ...state, gender: action.payload };
    case "NAME_CHANGED":
      return { ...state, name: action.payload.substring(0, 45) };
    case "WEIGHT_CHANGED":
      return { ...state, weight: action.payload };
    case "AGE_CHANGED":
      return { ...state, age: action.payload };
    case "HEIGHT_CHANGED":
      return { ...state, height: action.payload };
    case "BODY_FAT_CHANGED":
      return { ...state, bodyFatPercentage: action.payload };
    case "MUSCLE_MASS_CHANGED":
      return { ...state, muscleMassAttr: action.payload };
    case "STEPS_PER_DAY_CHANGED":
      return { ...state, stepsPerDay: action.payload };
    case "MACRO_PERCENT_CHANGED":
      let { index, macroPercent } = action.payload;
      const macroPercents = state.macroPercents.concat();
      const protein: number = Math.min(60, Math.max(50, macroPercent[0]));
      const carbs: number = Math.min(99, Math.max(51, macroPercent[1]));
      macroPercents[index] = [protein, carbs - protein];
      return { ...state, macroPercents };
    case "KCAL_ADJUSTMENT_CHANGED":
      const { index: kcalIndex, kcalAdjustment } = action.payload;
      const kcalAdjustments = state.kcalAdjustments.concat();
      kcalAdjustments[kcalIndex] = kcalAdjustment;
      return { ...state, kcalAdjustments };
    case "MULTIPLIER_CHANGED":
      const { index: multiplierIndex, isRest, multiplier } = action.payload;
      const multipliers = state.multipliers.concat();
      multipliers[multiplierIndex][isRest ? 0 : 1] = multiplier;
      return { ...state, multipliers };
    default:
      return state;
  }
};

type StateProviderProps = {
  children?: React.Node
};
type StateProviderState = QueryState & {
  dispatch: Action => void
};
export class StateProvider extends React.Component<
  StateProviderProps,
  StateProviderState
> {
  state = {
    name: "",
    gender: "M",
    weight: 0,
    height: 0,
    bodyFatPercentage: 0,
    muscleMassAttr: "NA",
    age: 0,
    stepsPerDay: 0,
    metric: true,
    base: 0,
    bmr: 0,
    macroPercents: defaultMacros,
    kcalAdjustments: getDefaultCaloricAdjustments("M"),
    multipliers: [[0, 0], [-0.075, 0.075]],
    dispatch: (action: Action) => {
      this.setState((state: QueryState) => {
        const newState: QueryState = reducer(state, action);
        saveQueryParams(newState);
        return newState; // force refresh, gross
      });
    }
  };

  static getDerivedStateFromProps = (props: {}, state: StateProviderState) => {
    // Super hacky way of grabbing the query string without needing another lib
    return getStateFromQuery(
      window.location.href.substring(
        window.location.href.split("#")[0].length + 6 // url length + #data=
      )
    );
  };

  render() {
    const {
      state,
      props: { children }
    } = this;
    return <Context.Provider value={state}>{children}</Context.Provider>;
  }
}

/**
 * Fun Component Business
 */

const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: stretch;
  margin: 20px;
  position: relative;
  max-width: 600px;
  width: 100%;
`;

const HeaderContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
`;

const FooterContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`;

const SocialContainer = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  width: 255px;
  margin-top: 25px;
  margin-bottom: 20px;
`;

const DisclaimerContainer = styled.div`
  width: 80%;
  font-style: italic;
`;

const MeasurementRadioGroup = styled(RadioGroup)`
  display: flex;
  flex-direction: row !important;
  @media (max-width: 603px) {
    width: 30%;
  }
`;

const InputContainer = styled(Paper)`
  padding: 20px;
  display: grid;
  grid-template-columns: 1.8fr 1.2fr;
  grid-template-areas:
    "name weight"
    "gender age"
    "muscle height"
    "bmr fat"
    "bmr activity";
  grid-gap: 20px;
  margin-bottom: 14px;
  @media (max-width: 603px) {
    grid-template-columns: 1fr;
    grid-template-areas:
      "name"
      "age"
      "weight"
      "gender"
      "muscle"
      "height"
      "fat"
      "activity"
      "bmr";
  }
`;

const BmrContainer = styled.div`
  grid-area: bmr;
  display: flex;
  flex-direction: column;

  .divider {
    margin-bottom: 10px;
  }
`;

const BmrItem = styled(Typography)`
  display: flex !important;
  align-items: center;
  flex-direction: row;
`;

const nearest = value => Math.round(value * 100) / 100;

const getDisplayHeight = (metric, height) =>
  nearest(metric ? height : height / CM_MULTIPLE);
const getDisplayWeight = (metric, weight) =>
  nearest(metric ? weight : weight * KG_MULTIPLE);
const formatValue = (value: number, defaultValue: string | null = null) => {
  if (isNaN(value) || value === 0) {
    return defaultValue || "";
  }
  return String(value);
};

const requiredBmrKeys = {
  weight: "Weight",
  age: "Age",
  height: "Height",
  bodyFatPercentage: "Body Fat Percentage"
};

const checkboxStyle = {
  fontSize: 16,
  marginRight: 5
};

const getMissingKeys = state =>
  Object.keys(requiredBmrKeys).filter(
    key => formatValue(state[key]).length === 0 || state[key] < 0
  );

const BmrDisplay = ({ state }) => {
  const missingKeys = getMissingKeys(state);
  const messages = Object.keys(requiredBmrKeys).reduce((messages, key) => {
    let icon = missingKeys.includes(key) ? (
      <CheckBoxOutlineBlank style={checkboxStyle} />
    ) : (
      <CheckBox style={checkboxStyle} />
    );
    messages.push(
      <BmrItem key={key} variant="body1">
        {icon}
        {`Provide your ${requiredBmrKeys[key]}`}
      </BmrItem>
    );
    return messages;
  }, []);

  if (missingKeys.length === 0) {
    return (
      <div>
        <BmrItem variant="display4" color="primary">
          {Math.round(state.bmr)}
        </BmrItem>
        <Typography variant="caption">daily kcals</Typography>
      </div>
    );
  } else {
    return messages;
  }
};

type AppState = {
  expansionPanelStates: Set<string>
};

// TODO: Include infomation tooltips that explain each
// TODO: Create calendar with checkboxes for if they are training days

class App extends React.Component<{}, AppState> {
  state: AppState = {
    expansionPanelStates: new Set(["cutPanel", "leangainsPanel"])
  };

  handleExpansionChange = (key: string) => (
    event: SyntheticEvent<HTMLButtonElement>,
    expanded: boolean
  ) => {
    const expansionPanelStates = new Set(this.state.expansionPanelStates);
    expanded ? expansionPanelStates.add(key) : expansionPanelStates.delete(key);
    this.setState({
      expansionPanelStates
    });
  };

  render() {
    return (
      <StateProvider>
        <Context.Consumer>
          {(state: StateProviderState) => {
            const showMacros = getMissingKeys(state).length === 0;
            return (
              <AppContainer>
                <HeaderContainer>
                  <div>
                    {" "}
                    <div>
                      <Typography variant="headline">
                        Leangains Calculator
                      </Typography>
                      <Tooltip title="This calculator uses the latest Crunching The Numbers algorithm from Martin Berkhan's Leangains book. Be advised that the caloric intake and macro ratios assume trainees eat TEF foods tracked using Atwater's standard. This app is unofficial and complimentary to those pursuing Martin's recommendations.">
                        <Typography
                          variant="subheading"
                          style={{ width: "max-content" }}
                        >
                          about
                          <InfoIcon
                            color="action"
                            style={{
                              fontSize: 12,
                              marginLeft: 5
                            }}
                          />
                        </Typography>
                      </Tooltip>
                    </div>
                    <a
                      href="https://www.amazon.com/Leangains-Method-Researched-Practiced-Perfected-ebook/dp/B07G3GFLTX/ref=sr_1_1?ie=UTF8&qid=1535321695&sr=8-1&keywords=leangains?_encoding=UTF8&camp=1789&creative=9325&linkCode=ur2&tag=storypodca-20&linkId=2P4S6EY6B462X4AR"
                      target="_blank"
                      style={{ marginTop: 10, display: "inline-block" }}
                    >
                      <img
                        src="https://images-na.ssl-images-amazon.com/images/G/01/associates/remote-buy-box/buy1.gif"
                        alt="Buy Leangains"
                      />
                    </a>
                  </div>

                  <MeasurementRadioGroup
                    aria-label="MetricOrImperial"
                    name="measureStandard"
                    value={state.metric ? "1" : "0"}
                    onChange={event =>
                      state.dispatch(
                        standardChanged(Number(event.target.value))
                      )
                    }
                  >
                    {[
                      { label: "Metric", value: "1" },
                      { label: "Imperial", value: "0" }
                    ].map(option => (
                      <FormControlLabel
                        key={option.value}
                        label={option.label}
                        control={<Radio color="primary" />}
                        value={option.value}
                      />
                    ))}
                  </MeasurementRadioGroup>
                </HeaderContainer>
                <InputContainer>
                  <TextField
                    style={{ gridArea: "name" }}
                    placeholder="Enter your name"
                    value={state.name}
                    label="Name"
                    onChange={event =>
                      state.dispatch(nameChanged(event.target.value))
                    }
                  />
                  <TextField
                    style={{ gridArea: "gender" }}
                    select
                    label="Sex"
                    value={state.gender}
                    onChange={event =>
                      state.dispatch(genderChanged(event.target.value))
                    }
                    helperText="Select your closest biological sex."
                  >
                    {[
                      { label: "Male", value: "M" },
                      { label: "Female", value: "F" }
                    ].map(option => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    style={{ gridArea: "weight" }}
                    placeholder={`Enter your weight in ${
                      state.metric ? "kg" : "lbs"
                    }`}
                    value={formatValue(
                      getDisplayWeight(state.metric, state.weight)
                    )}
                    label="Weight"
                    type="number"
                    error={state.weight < 0}
                    onChange={event =>
                      state.dispatch(
                        weightChanged(state.metric, event.target.value)
                      )
                    }
                  />
                  <TextField
                    style={{ gridArea: "age" }}
                    placeholder="Enter your age"
                    value={formatValue(state.age)}
                    label="Age"
                    error={state.age < 0}
                    type="number"
                    onChange={event =>
                      state.dispatch(ageChanged(event.target.value))
                    }
                  />
                  <TextField
                    style={{ gridArea: "height" }}
                    placeholder="Enter your height"
                    value={formatValue(
                      getDisplayHeight(state.metric, state.height)
                    )}
                    label={`Height ${state.metric ? "(cm)" : "(in)"}`}
                    type="number"
                    error={state.height < 0}
                    onChange={event =>
                      state.dispatch(
                        heightChanged(state.metric, event.target.value)
                      )
                    }
                  />
                  <TextField
                    style={{ gridArea: "fat" }}
                    placeholder="Enter your body fat percentage"
                    value={formatValue(state.bodyFatPercentage)}
                    label="Body Fat Percentage"
                    type="number"
                    error={state.bodyFatPercentage < 0}
                    onChange={event =>
                      state.dispatch(bodyFatChanged(event.target.value))
                    }
                  />
                  <TextField
                    style={{ gridArea: "muscle" }}
                    select
                    label="Muscle Mass"
                    value={state.muscleMassAttr}
                    onChange={event =>
                      state.dispatch(muscleMassChanged(event.target.value))
                    }
                    helperText="Select your muscle mass"
                  >
                    {[
                      { label: "Average", value: "NA" },
                      { label: "Muscular", value: "M" },
                      { label: "Very Muscular", value: "VM" }
                    ].map(option => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    style={{ gridArea: "activity" }}
                    placeholder="Enter your number of average daily steps"
                    value={formatValue(state.stepsPerDay, "0")}
                    type="number"
                    error={state.stepsPerDay < 0}
                    onChange={event =>
                      state.dispatch(stepsPerDayChanged(event.target.value))
                    }
                    label="Activity Level (Steps per day)"
                  />
                  <BmrContainer>
                    <Divider className="divider" />
                    <Typography variant="title">Maintenance Intake</Typography>
                    <BmrDisplay state={state} />
                  </BmrContainer>
                </InputContainer>
                {showMacros && (
                  <React.Fragment>
                    <Typography variant="subheading" gutterBottom>
                      Your macros
                    </Typography>
                    <MacrosPanel
                      state={state}
                      title="Standard"
                      restDayMultiplier={state.multipliers[0][0]}
                      trainingDayMultiplier={state.multipliers[0][1]}
                      onRestDayMultiplierChange={multiplier =>
                        state.dispatch(multiplierChanged(0)(true)(multiplier))
                      }
                      onTrainingDayMultiplierChange={multiplier =>
                        state.dispatch(multiplierChanged(0)(false)(multiplier))
                      }
                      kcalAdjustment={state.kcalAdjustments[0]}
                      macroPercents={[
                        state.macroPercents[0],
                        state.macroPercents[1]
                      ]}
                      onRestMacroChange={macros =>
                        state.dispatch(macroPercentChanged(0)(macros))
                      }
                      onTrainingMacroChange={macros =>
                        state.dispatch(macroPercentChanged(1)(macros))
                      }
                      onKcalAdjustmentChange={kcal =>
                        state.dispatch(kcalAdjustmentChanged(0)(kcal))
                      }
                      onChange={this.handleExpansionChange("leangainsPanel")}
                      expanded={this.state.expansionPanelStates.has(
                        "leangainsPanel"
                      )}
                    />
                    <MacrosPanel
                      state={state}
                      title="16:8 (Intermittent Fasting)"
                      restDayMultiplier={state.multipliers[1][0]}
                      trainingDayMultiplier={state.multipliers[1][1]}
                      onRestDayMultiplierChange={multiplier =>
                        state.dispatch(multiplierChanged(1)(true)(multiplier))
                      }
                      onTrainingDayMultiplierChange={multiplier =>
                        state.dispatch(multiplierChanged(1)(false)(multiplier))
                      }
                      kcalAdjustment={state.kcalAdjustments[1]}
                      macroPercents={[
                        state.macroPercents[2],
                        state.macroPercents[3]
                      ]}
                      onRestMacroChange={macros =>
                        state.dispatch(macroPercentChanged(2)(macros))
                      }
                      onTrainingMacroChange={macros =>
                        state.dispatch(macroPercentChanged(3)(macros))
                      }
                      onKcalAdjustmentChange={kcal =>
                        state.dispatch(kcalAdjustmentChanged(1)(kcal))
                      }
                      onChange={this.handleExpansionChange("cutPanel")}
                      expanded={this.state.expansionPanelStates.has("cutPanel")}
                    />
                  </React.Fragment>
                )}
                <FooterContainer>
                  <Typography
                    variant="body1"
                    style={{ display: "flex", alignItems: "center" }}
                  >
                    Made with
                    <Favorite
                      color="secondary"
                      fontSize="inherit"
                      style={{ fontSize: 15, margin: "0px 3px" }}
                    />
                    by&nbsp;
                    <a href="http://www.leonardsouza.com" target="_blank">
                      Leonard Souza
                    </a>
                  </Typography>
                  <Typography variant="caption">
                    This site is{" "}
                    <a
                      href="https://github.com/jslauthor/leangains"
                      target="_blank"
                    >
                      available on Github.
                    </a>
                  </Typography>
                  <SocialContainer>
                    <a
                      className="github-button"
                      href="https://github.com/jslauthor"
                      aria-label="Follow @jslauthor on GitHub"
                    >
                      Follow @jslauthor
                    </a>
                    <a
                      href="https://twitter.com/jslauthor?ref_src=twsrc%5Etfw"
                      className="twitter-follow-button"
                      data-show-count="false"
                    >
                      Follow @jslauthor
                    </a>
                  </SocialContainer>
                  <DisclaimerContainer>
                    <Typography variant="caption">
                      <strong>
                        Disclaimer: This website does not provide medical
                        advice.
                      </strong>{" "}
                      The information, including but not limited to, text,
                      graphics, images and other material contained on this
                      website are for informational purposes only. The purpose
                      of this website is to promote broad consumer understanding
                      and knowledge of various health topics. It is not intended
                      to be a substitute for professional medical advice,
                      diagnosis or treatment. Always seek the advice of your
                      physician or other qualified health care provider with any
                      questions you may have regarding a medical condition or
                      treatment and before undertaking a new health care
                      regimen, and never disregard professional medical advice
                      or delay in seeking it because of something you have read
                      on this website.
                    </Typography>
                  </DisclaimerContainer>
                </FooterContainer>
              </AppContainer>
            );
          }}
        </Context.Consumer>
      </StateProvider>
    );
  }
}

export default App;
