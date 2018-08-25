// @flow
import type { QueryState, Macros } from "../utils/StateUtils";

import * as React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import styled from "styled-components";

import "rc-slider/assets/index.css";
import { Range } from "rc-slider";

import Typography from "@material-ui/core/Typography";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import ExpansionPanel from "@material-ui/core/ExpansionPanel";
import ExpansionPanelSummary from "@material-ui/core/ExpansionPanelSummary";
import ExpansionPanelDetails from "@material-ui/core/ExpansionPanelDetails";

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
  title: string,
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
  restDayMultiplier: number,
  trainingDayMultiplier: number
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
`;

const MacroContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 45%;
  position: relative;
`;

const MacroKcalContainer = styled.div`
  position: relative;
  display: flex;
  justify-content: center;
  margin-top: -55px;
  margin-bottom: 15px;
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

const MacroChart = ({ data, title, kcals, onMacroChange }: MacroChartProps) => (
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
  </MacroContainer>
);

const MacrosPanel = ({
  state,
  expanded,
  onChange,
  title,
  macroPercents = [[60, 25], [60, 25]],
  kcalAdjustment,
  onRestMacroChange,
  onTrainingMacroChange,
  restDayMultiplier = 1,
  trainingDayMultiplier = 1
}: MacrosPanelProps) => {
  const targetKcals = state.bmr + kcalAdjustment;
  return (
    <ExpansionPanel expanded={expanded} onChange={onChange}>
      <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
        <Typography variant="title">{title}</Typography>
      </ExpansionPanelSummary>
      <ExpansionPanelDetails>
        <MacroChartsContainer>
          <MacroChart
            onMacroChange={onRestMacroChange}
            title="Rest Day"
            kcals={Math.round(targetKcals * restDayMultiplier)}
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
            title="Training Day"
            kcals={Math.round(targetKcals * trainingDayMultiplier)}
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
    </ExpansionPanel>
  );
};

export default MacrosPanel;
