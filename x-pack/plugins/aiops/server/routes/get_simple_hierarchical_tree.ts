/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { max } from 'd3-array';
import { omit, uniq } from 'lodash';

import type { ChangePointGroup, FieldValuePair } from '@kbn/ml-agg-utils';

import type { ItemsetResult } from './generate_itemsets';

function getValueCounts(df: ItemsetResult[], field: string) {
  return df.reduce((p, c) => {
    if (c.set[field] === undefined) {
      return p;
    }
    p[c.set[field]] = p[c.set[field]] ? p[c.set[field]] + 1 : 1;
    return p;
  }, {} as Record<string, number>);
}

function getValuesDescending(df: ItemsetResult[], field: string): string[] {
  const valueCounts = getValueCounts(df, field);
  const keys = Object.keys(valueCounts);

  return keys.sort((a, b) => {
    return valueCounts[b] - valueCounts[a];
  });
}

interface NewNode {
  name: string;
  set: FieldValuePair[];
  docCount: number;
  children: NewNode[];
  icon: string;
  iconStyle: string;
  addNode: (node: NewNode) => void;
}

function NewNodeFactory(name: string): NewNode {
  const children: NewNode[] = [];

  const addNode = (node: NewNode) => {
    children.push(node);
  };

  return {
    name,
    set: [],
    docCount: 0,
    children,
    icon: 'default',
    iconStyle: 'default',
    addNode,
  };
}

/**
 * Simple (poorly implemented) function that constructs a tree from an itemset DataFrame sorted by support (count)
 * The resulting tree components are non-overlapping subsets of the data.
 * In summary, we start with the most inclusive itemset (highest count), and perform a depth first search in field order.
 *
 * TODO - the code style here is hacky and should be re-written
 *
 * @param displayParent
 * @param parentDocCount
 * @param parentLabel
 * @param field
 * @param value
 * @param iss
 * @param collapseRedundant
 * @param displayOther
 * @returns
 */
function dfDepthFirstSearch(
  fields: string[],
  displayParent: NewNode,
  parentDocCount: number,
  parentLabel: string,
  field: string,
  value: string,
  iss: ItemsetResult[],
  collapseRedundant: boolean,
  displayOther: boolean
) {
  // df = df[df[field] == value].copy(deep=True)
  // if len(df) == 0:
  //     return 0

  const filteredItemSets = iss.filter((is) => {
    for (const [key, values] of Object.entries(is.set)) {
      if (key === field && values.includes(value)) {
        return true;
      }
    }
    return false;
  });

  if (filteredItemSets.length === 0) {
    return 0;
  }

  // doc_count = df['doc_count'].max()
  // total_doc_count = df['total_doc_count'].max()
  const docCount = max(filteredItemSets.map((fis) => fis.doc_count)) ?? 0;
  const totalDocCount = max(filteredItemSets.map((fis) => fis.total_doc_count)) ?? 0;

  // label = f"{parent_label} '{value}'"
  let label = `${parentLabel} ${value}`;

  // if parent_doc_count == doc_count and collapse_redundant:
  //     # collapse identical paths
  //     display_parent.name += f" '{value}'"
  //     display_node = display_parent
  // else:
  //     display_node = ipytree.Node(f"{doc_count}/{total_doc_count}{label}")
  //     display_node.icon_style = 'warning'
  //     display_parent.add_node(display_node)
  let displayNode: NewNode;
  if (parentDocCount === docCount && collapseRedundant) {
    // collapse identical paths
    displayParent.name += ` ${value}`;
    displayParent.set.push({ fieldName: field, fieldValue: value });
    displayParent.docCount = docCount;
    displayNode = displayParent;
  } else {
    displayNode = NewNodeFactory(`${docCount}/${totalDocCount}${label}`);
    displayNode.iconStyle = 'warning';
    displayNode.set = [...displayParent.set];
    displayNode.set.push({ fieldName: field, fieldValue: value });
    displayNode.docCount = docCount;
    displayParent.addNode(displayNode);
  }

  // get children
  // while True:
  //     next_field_index = fields.index(field) + 1
  //     if next_field_index >= len(fields):
  //         display_node.icon = 'file'
  //         display_node.icon_style = 'info'
  //         return doc_count
  //     next_field = fields[next_field_index]

  //     # TODO - add handling of creating * as next level of tree

  //     if len(df[next_field].value_counts().index) > 0:
  //         break
  //     else:
  //         field = next_field
  //         if collapse_redundant:
  //             # add dummy node label
  //             display_node.name += " '*'"
  //             label += " '*'"
  //         else:
  //             label += " '*'"
  //             next_display_node = ipytree.Node(f"{doc_count}/{total_doc_count}{label}")
  //             next_display_node.icon_style = 'warning'
  //             display_node.add_node(next_display_node)

  //             display_node = next_display_node
  let nextField: string;
  while (true) {
    const nextFieldIndex = fields.indexOf(field) + 1;
    if (nextFieldIndex >= fields.length) {
      displayNode.icon = 'file';
      displayNode.iconStyle = 'info';
      return docCount;
    }
    nextField = fields[nextFieldIndex];

    // TODO - add handling of creating * as next level of tree

    // console.log(
    //   'filter',
    //   nextField,
    //   filteredItemSets.filter((is) => is.items[nextField] !== undefined).length
    // );

    if (Object.keys(getValueCounts(filteredItemSets, nextField)).length > 0) {
      break;
    } else {
      field = nextField;
      if (collapseRedundant) {
        // add dummy node label
        displayNode.name += ` '*'`;
        label += ` '*'`;
        const nextDisplayNode = NewNodeFactory(`${docCount}/${totalDocCount}${label}`);
        nextDisplayNode.iconStyle = 'warning';
        nextDisplayNode.set = displayNode.set;
        nextDisplayNode.docCount = docCount;
        displayNode.addNode(nextDisplayNode);
        displayNode = nextDisplayNode;
      }
    }
  }

  // sub_count = 0
  // for next_value in df[next_field].value_counts().index:
  //     sub_count += ItemSetTree.df_depth_first_search(fields, display_node, doc_count, label, next_field,
  //                                                    next_value, df,
  //                                                    collapse_redundant,
  //                                                    display_other)
  let subCount = 0;
  for (const nextValue of getValuesDescending(filteredItemSets, nextField)) {
    subCount += dfDepthFirstSearch(
      fields,
      displayNode,
      docCount,
      label,
      nextField,
      nextValue,
      filteredItemSets,
      collapseRedundant,
      displayOther
    );
  }

  // if display_other:
  // if sub_count < doc_count:
  //     display_node.add_node(
  //         ipytree.Node(f"{doc_count - sub_count}/{total_doc_count}{parent_label} '{value}' 'OTHER'"))
  if (displayOther) {
    if (subCount < docCount) {
      displayNode.addNode(
        NewNodeFactory(`${docCount - subCount}/${totalDocCount}${parentLabel} '{value}' 'OTHER`)
      );
    }
  }

  return docCount;
}

/**
 * Create simple tree consisting or non-overlapping sets of data.
 *
 * By default (fields==None), the field search order is dependent on the highest count itemsets.
 */
export function getSimpleHierarchicalTree(
  df: ItemsetResult[],
  collapseRedundant: boolean,
  displayOther: boolean,
  fields: string[] = []
) {
  const candidates = uniq(
    df.flatMap((d) =>
      Object.keys(omit(d, ['size', 'maxPValue', 'doc_count', 'support', 'total_doc_count']))
    )
  );

  const field = fields[0];

  const totalDocCount = max(df.map((d) => d.total_doc_count)) ?? 0;

  const newRoot = NewNodeFactory('');

  for (const value of getValuesDescending(df, field)) {
    dfDepthFirstSearch(
      fields,
      newRoot,
      totalDocCount + 1,
      '',
      field,
      value,
      df,
      collapseRedundant,
      displayOther
    );
  }

  return { root: newRoot, fields };
}

/**
 * Get leaves from hierarchical tree.
 */
export function getSimpleHierarchicalTreeLeaves(
  tree: NewNode,
  leaves: ChangePointGroup[],
  level = 1
) {
  // console.log(`${'-'.repeat(level)} ${tree.name} ${tree.children.length}`);
  if (tree.children.length === 0) {
    leaves.push({ group: tree.set, docCount: tree.docCount });
  } else {
    for (const child of tree.children) {
      const newLeaves = getSimpleHierarchicalTreeLeaves(child, [], level + 1);
      if (newLeaves.length > 0) {
        leaves.push(...newLeaves);
      }
    }
  }

  return leaves;
}

/**
 * Analyse duplicate field/value pairs in change point groups.
 */
export function markDuplicates(cpgs: ChangePointGroup[]): ChangePointGroup[] {
  const fieldValuePairCounts: Record<string, number> = {};
  cpgs.forEach((cpg) => {
    cpg.group.forEach((g) => {
      const str = `${g.fieldName}$$$$${g.fieldValue}`;
      fieldValuePairCounts[str] = fieldValuePairCounts[str] ? fieldValuePairCounts[str] + 1 : 1;
    });
  });

  return cpgs.map((cpg) => {
    return {
      ...cpg,
      group: cpg.group.map((g) => {
        const str = `${g.fieldName}$$$$${g.fieldValue}`;
        return {
          ...g,
          duplicate: fieldValuePairCounts[str] > 1,
        };
      }),
    };
  });
}
