const updateData = {
  ...(name !== undefined && { name }),
  ...(nameEn !== undefined && { nameEn }),
  ...(subscriptionStartDate !== undefined && {
    subscriptionStartDate: subscriptionStartDate ? new Date(subscriptionStartDate) : null,
  }),
  ...(subscriptionEndDate !== undefined && {
    subscriptionEndDate: subscriptionEndDate ? new Date(subscriptionEndDate) : null,
  }),
  ...(typeof isActive === 'boolean' && { isActive }),
};