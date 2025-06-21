import React from 'react'
import styled, { css } from 'styled-components'

type ButtonSize = 'small' | 'medium' | 'large'

const StyledButton = styled.button<{$main?: boolean, $size: ButtonSize}>`
  --color: var(--whisky-ui-button-default-color);
  --background-color: var(--whisky-ui-button-default-background);
  --background-color-hover: var(--whisky-ui-button-default-background-hover);

  ${(props) => props.$main && css`
    --background-color: var(--whisky-ui-button-main-background);
    --color: var(--whisky-ui-button-main-color);
    --background-color-hover: var(--whisky-ui-button-main-background-hover);
  `}

  ${(props) => css`
    --padding: ${props.$size === 'small' ? '5px' : props.$size === 'medium' ? '10px' : props.$size === 'large' && '15px'};
  `}

  background: var(--background-color);
  color: var(--color);
  &:hover {
    background: var(--background-color-hover);
  }

  border: none;
  border-radius: var(--whisky-ui-border-radius);
  padding: var(--padding);
  cursor: pointer;
  /* min-width: 100px; */
  text-align: center;
  align-items: center;

  &:disabled {
    cursor: default;
    opacity: .7;
  }
`

export interface ButtonProps extends React.PropsWithChildren {
  disabled?: boolean
  onClick?: () => void
  main?: boolean
  size?: ButtonSize
}

export function Button(props: ButtonProps) {
  return (
    <StyledButton
      disabled={props.disabled}
      onClick={props.onClick}
      $main={props.main}
      $size={props.size ?? 'medium'}
    >
      {props.children}
    </StyledButton>
  )
}
