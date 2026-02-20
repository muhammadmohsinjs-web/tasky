import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import {
  Button,
  DatePicker,
  FileUpload,
  FormField,
  FormWrapper,
  MultiSelect,
  OTPInput,
  PasswordInput,
  RangeSlider,
  SearchInput,
  SelectDropdown,
  TimePicker,
} from '..'

const meta = {
  title: 'Design System/Forms/Overview',
  parameters: { layout: 'padded' },
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

function FormsPreview() {
  const [multi, setMulti] = useState<string[]>(['design'])
  const [otp, setOtp] = useState('')

  return (
    <FormWrapper className="max-w-xl">
      <FormField label="Search">
        <SearchInput placeholder="Search tasks" />
      </FormField>

      <FormField label="Select">
        <SelectDropdown
          options={[
            { label: 'Product', value: 'product' },
            { label: 'Engineering', value: 'engineering' },
          ]}
          defaultValue="product"
        />
      </FormField>

      <FormField label="Multi Select">
        <MultiSelect
          options={[
            { label: 'Design', value: 'design' },
            { label: 'Backend', value: 'backend' },
            { label: 'Frontend', value: 'frontend' },
          ]}
          selectedValues={multi}
          onChange={setMulti}
        />
      </FormField>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <FormField label="Date">
          <DatePicker />
        </FormField>
        <FormField label="Time">
          <TimePicker />
        </FormField>
      </div>

      <FormField label="Password">
        <PasswordInput placeholder="Enter password" />
      </FormField>

      <FormField label="OTP">
        <OTPInput value={otp} onChange={setOtp} />
      </FormField>

      <FormField label="Range">
        <RangeSlider defaultValue={55} />
      </FormField>

      <FormField label="File Upload">
        <FileUpload />
      </FormField>

      <Button>Submit</Button>
    </FormWrapper>
  )
}

export const Overview: Story = {
  render: () => <FormsPreview />,
}
