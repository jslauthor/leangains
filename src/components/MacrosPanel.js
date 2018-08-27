// @flow
import type { QueryState, Macros } from "../utils/StateUtils";

import * as React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import styled from "styled-components";
import isEqual from "react-fast-compare";

import "rc-slider/assets/index.css";
import { Range } from "rc-slider";

import TextField from "@material-ui/core/TextField";
import Typography from "@material-ui/core/Typography";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import ExpansionPanel from "@material-ui/core/ExpansionPanel";
import ExpansionPanelSummary from "@material-ui/core/ExpansionPanelSummary";
import ExpansionPanelDetails from "@material-ui/core/ExpansionPanelDetails";

import Dialog from "@material-ui/core/Dialog";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import DialogActions from "@material-ui/core/DialogActions";

import Button from "@material-ui/core/Button";
import SettingsIcon from "@material-ui/icons/Settings";
import IconButton from "@material-ui/core/IconButton";

import blue from "@material-ui/core/colors/blue";
import green from "@material-ui/core/colors/green";
import pink from "@material-ui/core/colors/pink";

type ChartData = {
  name: string,
  value: number
};

type MacroChartProps = {
  data: Array<ChartData>,
  kcals: number,
  title: string | React.Node,
  onMacroChange: Macros => void
};

type MacrosPanelProps = {
  state: QueryState,
  expanded: boolean,
  onChange: (SyntheticEvent<HTMLButtonElement>, boolean) => void,
  title: React.Node,
  macroPercents: Array<Macros>, // Order: Protein, Carbs
  kcalAdjustment: number,
  onRestMacroChange: Macros => void,
  onTrainingMacroChange: Macros => void,
  onRestDayMultiplierChange: number => void,
  onTrainingDayMultiplierChange: number => void,
  onKcalAdjustmentChange: number => void,
  restDayMultiplier: number,
  trainingDayMultiplier: number,
  isDialogueOpen?: boolean,
  onDialogueOpenChange?: boolean => (SyntheticEvent<HTMLButtonElement>) => void
};

const PROTEIN_COLOR = green[500];
const CARB_COLOR = blue[500];
const FAT_COLOR = pink[500];
const COLORS = [PROTEIN_COLOR, CARB_COLOR, FAT_COLOR];

const getGramValue = (type: "C" | "F" | "P") => {
  switch (type) {
    case "C":
    case "P":
      return 4;
    case "F":
      return 9;
    default:
      return 0;
  }
};

const MacroChartsContainer = styled.div`
  display: flex;
  justify-content: space-evenly;
  width: 100%;
  position: relative;
  flex-wrap: wrap;
`;

const MacroContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 45%;
  position: relative;
  min-width: 250px;
  @media (max-width: 603px) {
    margin-bottom: 20px;
    width: 100%;
  }
`;

const MacroKcalContainer = styled.div`
  position: relative;
  display: flex;
  justify-content: center;
  margin-top: -55px;
  margin-bottom: 15px;
`;

const FlexRow = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
`;

const FlexColumn = styled.div`
  display: flex;
  flex-direction: column;
  div {
    margin-bottom: 10px;
  }
`;

const MACRO_KEYS = ["P", "C", "F"];
const MacroLabelContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
`;
const MacroLabelsContainer = styled(MacroLabelContainer)`
  justify-content: space-around;
  margin-bottom: 25px;
  width: 250px;
  align-self: center;
`;
const MacroRangeContainer = styled.div`
  max-width: 250px;
  align-self: center;
`;

const getMacroColor = (type: "C" | "F" | "P") => {
  switch (type) {
    case "C":
      return CARB_COLOR;
    case "P":
      return PROTEIN_COLOR;
    case "F":
      return FAT_COLOR;
    default:
      return "white";
  }
};

const getRangeArray = (data: Array<ChartData>) => {
  return data.reduce(
    ({ values, sum }, { value }, index) => {
      sum += value;
      values.push(sum);
      return { values, sum };
    },
    { values: [], sum: 0 }
  ).values;
};

const MacroType = styled.div`
  background-color: ${({ type }) => getMacroColor(type)};
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-right: 5px;
`;
const MacroLabel = ({
  type,
  grams
}: {
  type: "C" | "F" | "P",
  grams: string
}) => (
  <MacroLabelContainer>
    <MacroType type={type}>
      <Typography variant="body2" style={{ color: "white" }}>
        {type}
      </Typography>
    </MacroType>
    <Typography variant="body1">
      <strong>{grams}</strong> g
    </Typography>
  </MacroLabelContainer>
);

const RADIAN = Math.PI / 180;
const renderLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  startAngle,
  endAngle,
  fill,
  payload,
  percent,
  value
}) => {
  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  const tx = cx + (outerRadius + 5) * cos;
  const ty = cy + (outerRadius + 5) * sin;
  const textAnchor = cos >= 0 ? "start" : "end";

  return (
    <g>
      <text
        fill={fill}
        textAnchor={textAnchor}
        className="recharts-pie-label-text"
        x={tx}
        y={ty}
      >{`${(percent * 100).toFixed(0)}%`}</text>
    </g>
  );
};

const MacroChartBase = ({
  data,
  title,
  kcals,
  onMacroChange
}: MacroChartProps) => {
  return (
    <MacroContainer>
      <Typography variant="subheading">{title}</Typography>
      <ResponsiveContainer width="100%" height={120}>
        <PieChart>
          <Pie
            cx="50%"
            cy={100}
            data={data}
            dataKey="value"
            innerRadius={60}
            outerRadius={80}
            startAngle={180}
            endAngle={0}
            label={renderLabel}
            labelLine={false}
            isAnimationActive={false}
          >
            {data.map((entry, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>

      <MacroKcalContainer>
        <div>
          <Typography variant="display1">{kcals}</Typography>
          <Typography variant="caption">daily kcals</Typography>
        </div>
      </MacroKcalContainer>
      <MacroLabelsContainer>
        {MACRO_KEYS.map((macro, index) => (
          <MacroLabel
            key={macro}
            type={macro}
            grams={String(
              Math.floor(
                (kcals * (data[index].value / 100)) / getGramValue(macro)
              )
            )}
          />
        ))}
      </MacroLabelsContainer>
      <MacroRangeContainer>
        <Range
          value={getRangeArray(data)}
          allowCross={false}
          onChange={onMacroChange}
          pushable
          marks={{
            "50": "",
            "60": ""
          }}
          trackStyle={[
            { backgroundColor: CARB_COLOR },
            { backgroundColor: FAT_COLOR }
          ]}
          handleStyle={[{}, {}, { display: "none" }]}
          railStyle={{ backgroundColor: PROTEIN_COLOR }}
        />
        <Typography variant="caption">
          Adjust your macro ratio (protein 50%-60%)
        </Typography>
      </MacroRangeContainer>
    </MacroContainer>
  );
};

const formatKcalAdjustmentLabel = (kcalAdjustment: number) => {
  if (kcalAdjustment < 0) {
    return `- ${Math.abs(kcalAdjustment)}`;
  }

  return `+ ${kcalAdjustment}`;
};

const nearest = value => Math.round(value * 100) / 100;

const formatMultiplier = (multiplier: number) => nearest(multiplier * 100);

const formatPercentLabel = (multiplier: number) => {
  const sign = multiplier > 0 ? "+" : multiplier < 0 ? "-" : "+/-";
  return `(${sign}${Math.abs(formatMultiplier(multiplier))}%)`;
};

const MacroSettingsDialogue = ({
  title,
  open,
  onClose,
  kcalAdjustment,
  onKcalAdjustmentChange,
  restDayMultiplier,
  onRestDayMultiplierChange,
  trainingDayMultiplier,
  onTrainingDayMultiplierChange
}) => {
  const restDayMultiplierValue =
    formatMultiplier(restDayMultiplier) === 0
      ? ""
      : formatMultiplier(restDayMultiplier);
  const trainingDayMultiplierValue =
    formatMultiplier(trainingDayMultiplier) === 0
      ? ""
      : formatMultiplier(trainingDayMultiplier);
  return (
    <Dialog open={open} onClose={onClose} aria-labelledby="form-dialog-title">
      <DialogTitle id="form-dialog-title">{title}</DialogTitle>
      <DialogContent style={{ width: 200 }}>
        <FlexColumn>
          <TextField
            placeholder="Enter caloric deficit or surplus"
            value={kcalAdjustment === 0 ? "" : kcalAdjustment}
            label="Gross Kcal Adjustment"
            type="number"
            onChange={event =>
              onKcalAdjustmentChange(Number(event.target.value))
            }
          />
          <TextField
            placeholder="Enter rest day kcal % change"
            value={restDayMultiplierValue}
            label="Rest Day Kcal % Change"
            type="number"
            onChange={event =>
              onRestDayMultiplierChange(Number(event.target.value) / 100)
            }
          />
          <TextField
            placeholder="Enter training day kcal % change"
            value={trainingDayMultiplierValue}
            label="Training Day Kcal % Change"
            type="number"
            onChange={event =>
              onTrainingDayMultiplierChange(Number(event.target.value) / 100)
            }
          />
        </FlexColumn>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Done
        </Button>
      </DialogActions>
    </Dialog>
  );
};

class MacroChart extends React.Component<MacroChartProps, {}> {
  shouldComponentUpdate(nextProps) {
    return (
      !isEqual(this.props.data, nextProps.data) ||
      this.props.kcals !== nextProps.kcals
    );
  }

  render() {
    return <MacroChartBase {...this.props} />;
  }
}

const SettingsButton = ({ onClick }) => (
  <IconButton
    style={{ width: 28, height: 28, marginLeft: 5 }}
    aria-label="Settings"
    onClick={onClick}
  >
    <SettingsIcon fontSize="inherit" style={{ fontSize: 14 }} />
  </IconButton>
);

const applyPercentChange = (base: number, percent: number) =>
  Math.round(base + base * percent);

const MacrosPanel = ({
  state,
  expanded,
  onChange,
  title,
  isDialogueOpen,
  onDialogueOpenChange,
  macroPercents = [[60, 25], [60, 25]],
  kcalAdjustment,
  onRestMacroChange,
  onTrainingMacroChange,
  onKcalAdjustmentChange,
  restDayMultiplier = 1,
  trainingDayMultiplier = 1,
  onRestDayMultiplierChange,
  onTrainingDayMultiplierChange
}: MacrosPanelProps) => {
  const targetKcals = state.bmr + kcalAdjustment;
  return (
    <ExpansionPanel expanded={expanded} onChange={onChange}>
      <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
        <div>
          <Typography variant="title">{title}</Typography>
          <FlexRow>
            <Typography variant="caption">
              <strong>{Math.round(targetKcals)} adjusted kcals</strong>{" "}
              (maintenance {formatKcalAdjustmentLabel(kcalAdjustment)})
            </Typography>
            <SettingsButton
              onClick={onDialogueOpenChange && onDialogueOpenChange(true)}
            />
          </FlexRow>
        </div>
      </ExpansionPanelSummary>
      <ExpansionPanelDetails>
        <MacroChartsContainer>
          <MacroChart
            onMacroChange={onRestMacroChange}
            title={
              <FlexRow>
                Rest Day {formatPercentLabel(restDayMultiplier)}{" "}
                <SettingsButton
                  onClick={onDialogueOpenChange && onDialogueOpenChange(true)}
                />
              </FlexRow>
            }
            kcals={applyPercentChange(targetKcals, restDayMultiplier)}
            data={[
              { name: "Protein", value: macroPercents[0][0] },
              { name: "Carbs", value: macroPercents[0][1] },
              {
                name: "Fat",
                value: 100 - (macroPercents[0][0] + macroPercents[0][1])
              }
            ]}
          />
          <MacroChart
            onMacroChange={onTrainingMacroChange}
            title={
              <FlexRow>
                Training Day {formatPercentLabel(trainingDayMultiplier)}{" "}
                <SettingsButton
                  onClick={onDialogueOpenChange && onDialogueOpenChange(true)}
                />
              </FlexRow>
            }
            kcals={applyPercentChange(targetKcals, trainingDayMultiplier)}
            data={[
              { name: "Protein", value: macroPercents[1][0] },
              { name: "Carbs", value: macroPercents[1][1] },
              {
                name: "Fat",
                value: 100 - (macroPercents[1][0] + macroPercents[1][1])
              }
            ]}
          />
        </MacroChartsContainer>
      </ExpansionPanelDetails>
      <MacroSettingsDialogue
        title={title}
        open={isDialogueOpen}
        onClose={onDialogueOpenChange && onDialogueOpenChange(false)}
        kcalAdjustment={kcalAdjustment}
        onRestDayMultiplierChange={onRestDayMultiplierChange}
        onTrainingDayMultiplierChange={onTrainingDayMultiplierChange}
        onKcalAdjustmentChange={onKcalAdjustmentChange}
        restDayMultiplier={restDayMultiplier}
        trainingDayMultiplier={trainingDayMultiplier}
      />
    </ExpansionPanel>
  );
};

type MacrosPanelState = {
  isDialogueOpen: boolean
};

class MacrosPanelStateProvider extends React.Component<
  MacrosPanelProps,
  MacrosPanelState
> {
  state = {
    isDialogueOpen: false
  };

  onDialogueOpenChange = (isOpen: boolean) => (
    event: SyntheticEvent<HTMLButtonElement>
  ) => {
    event.stopPropagation();
    event.preventDefault();
    this.setState({ isDialogueOpen: isOpen });
  };

  render() {
    return (
      <MacrosPanel
        {...this.props}
        isDialogueOpen={this.state.isDialogueOpen}
        onDialogueOpenChange={this.onDialogueOpenChange}
      />
    );
  }
}

export default MacrosPanelStateProvider;
