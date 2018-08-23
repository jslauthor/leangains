// @flow
import type { QueryState } from "../utils/StateUtils";

import * as React from "react";
import { PieChart, Pie, Cell } from "recharts";
import styled from "styled-components";

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
  title: string
};

type MacrosPanelProps = {
  state: QueryState,
  expanded: boolean,
  onChange: (SyntheticEvent<HTMLButtonElement>, boolean) => void,
  title: React.Node,
  proteinPercent: number,
  carbsPercent: number,
  fatPercent: number,
  kcalAdjustment: number
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
  justify-content: space-around;
  width: 100%;
`;

const MacroContainer = styled.div`
  display: flex;
  flex-direction: column;
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
    <Typography variant="body1">{grams}g</Typography>
  </MacroLabelContainer>
);

const MacroChart = ({ data, title, kcals }: MacroChartProps) => (
  <MacroContainer>
    <Typography variant="subheading">{title}</Typography>
    <PieChart width={250} height={120}>
      <Pie
        cy={100}
        data={data}
        dataKey="value"
        innerRadius={60}
        outerRadius={80}
        paddingAngle={2}
        startAngle={180}
        endAngle={0}
      >
        {data.map((entry, index) => (
          <Cell key={index} fill={COLORS[index % COLORS.length]} />
        ))}
      </Pie>
    </PieChart>
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
  </MacroContainer>
);

const MacrosPanel = ({
  state,
  expanded,
  onChange,
  title,
  proteinPercent = 60,
  carbsPercent = 25,
  fatPercent = 25,
  kcalAdjustment
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
            title="Rest Day"
            kcals={Math.round(targetKcals * 0.925)}
            data={[
              { name: "Protein", value: proteinPercent },
              { name: "Carbs", value: carbsPercent },
              { name: "Fat", value: fatPercent }
            ]}
          />
          <MacroChart
            title="Training Day"
            kcals={Math.round(targetKcals * 1.0925)}
            data={[
              { name: "Protein", value: proteinPercent },
              { name: "Carbs", value: carbsPercent },
              { name: "Fat", value: fatPercent }
            ]}
          />
        </MacroChartsContainer>
      </ExpansionPanelDetails>
    </ExpansionPanel>
  );
};

export default MacrosPanel;
