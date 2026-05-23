const getProductsQuery = () => {
  return `
    SELECT json_agg(
    json_build_object(
        'inventory_element_code', inventory_element_code,
        'saree_code', saree_code,
        'sequence_number', sequence_number,
        'category_name', category_name,
        'sub_category', sub_category,
        'ie_description1', ie_description1,
        'ie_description2', ie_description2,
        'border', border,
        'blouse', blouse,
        'material', material,
        'pallu', pallu,
        'color', color,
        'saree_status_code', saree_status_code,
        'saree_status_title', saree_status_title,
        'img_directory', img_directory,
        'video_directory', video_directory,
        'act_price', act_price,
        'margin_percent', margin_percent,
        'base_price', base_price,
        'total_quantity', total_quantity,
        'out_of_stock_message', out_of_stock_message
    )
) AS result
FROM (
    SELECT
        ie.code AS inventory_element_code,

        ied.code AS saree_code,

        ROW_NUMBER() OVER (
            ORDER BY
                ie.code,
                ied.code,
                ied.id
        ) AS sequence_number,

        ie.type_name AS category_name,

        ie.title AS sub_category,

        ie.description1 AS ie_description1,

        ie.description2 AS ie_description2,

        ie.border,

        ie.blouse,

        ie.material,

        ie.pallu,

        ied.color,

        ss.code AS saree_status_code,

        ss.title AS saree_status_title,

        ied.img_directory,

        ied.video_directory,

        ie.act_price,

        mr.margin_percent,

        (
            (
                FLOOR(
                    (
                        ie.act_price +
                        (
                            ie.act_price * mr.margin_percent / 100.0
                        )
                    ) / 100
                ) * 100
            ) + 99
        ) AS base_price,

        ied.quantity AS total_quantity,

        CASE
            WHEN ied.quantity >= 3 THEN 'In stock'
            WHEN ied.quantity = 2 THEN 'Only 2 left'
            WHEN ied.quantity = 1 THEN 'Only 1 left'
            ELSE 'Restocking Soon'
        END AS out_of_stock_message

    FROM inventory_elements_data ied

    JOIN inventory_elements ie
        ON ie.id = ied.inventory_element_id

    JOIN inventory i
        ON i.id = ie.inventory_id

    JOIN saree_statuses ss
        ON ss.id = ied.saree_status_id

    JOIN margin_ranges mr
        ON ie.act_price BETWEEN mr.price_from AND mr.price_until

    WHERE
        i.is_active = TRUE
        AND ie.is_active = TRUE
        AND ied.is_active = TRUE
        AND ss.is_active = TRUE
        AND mr.is_active = TRUE

) final_data;`;
};
module.exports = getProductsQuery;
