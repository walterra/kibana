/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { MouseEventHandler, FC } from 'react';
import PropTypes from 'prop-types';
import { EuiButtonIcon } from '@elastic/eui';
// @ts-expect-error untyped local
import { Popover, PopoverChildrenProps } from '../popover';
import { ArgAdd } from '../arg_add';
// @ts-expect-error untyped local
import { Arg } from '../../expression_types/arg';

import { ComponentStrings } from '../../../i18n';

const { ArgAddPopover: strings } = ComponentStrings;

interface ArgOptions {
  arg: Arg;
  onValueAdd: () => void;
}

interface Props {
  options: ArgOptions[];
}

export const ArgAddPopover: FC<Props> = ({ options }) => {
  const button = (handleClick: MouseEventHandler<HTMLButtonElement>) => (
    <EuiButtonIcon
      iconType="plusInCircle"
      aria-label={strings.getAddAriaLabel()}
      onClick={handleClick}
      className="canvasArg__addArg"
    />
  );

  return (
    <Popover
      id="arg-add-popover"
      panelClassName="canvasArg__addPopover"
      panelPaddingSize="none"
      button={button}
    >
      {({ closePopover }: PopoverChildrenProps) =>
        options.map((opt) => (
          <ArgAdd
            key={`${opt.arg.name}-add`}
            displayName={opt.arg.displayName}
            help={opt.arg.help}
            onValueAdd={() => {
              opt.onValueAdd();
              closePopover();
            }}
          />
        ))
      }
    </Popover>
  );
};

ArgAddPopover.propTypes = {
  options: PropTypes.array.isRequired,
};
